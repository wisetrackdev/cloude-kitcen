using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CloudeKicten.Models.DatabaseLayer;

namespace CloudeKicten.Models.BusinessLayer
{
    public interface IBusinessLayer_AdminController
    {
        Task<ApiResponse<AdminStatsDto>> GetDashboardStatsAsync(string adminUserId);
        Task<ApiResponse<List<VendorDb>>> GetPendingVendorsAsync(string adminUserId);
        Task<ApiResponse<bool>> ApproveVendorAsync(string adminUserId, string vendorId, string status);
        Task<ApiResponse<bool>> ApproveRiderAsync(string adminUserId, string riderId, bool isApproved);
        Task<ApiResponse<List<SettlementDb>>> GetAllSettlementsAsync(string adminUserId);
        Task<ApiResponse<SettlementDb>> CreateSettlementAsync(string adminUserId, SettlementDb settlement);
        Task<ApiResponse<bool>> UpdateSettlementStatusAsync(string adminUserId, string settlementId, string status, string txDetails);
        Task<ApiResponse<List<BannerDb>>> GetActiveBannersAsync();
        Task<ApiResponse<BannerDb>> UploadBannerAsync(string adminUserId, BannerDb banner);
        Task<ApiResponse<bool>> TruncateAllTablesAsync(string adminUserId);
    }

    public class BusinessLayer_AdminController : IBusinessLayer_AdminController
    {
        private readonly IDatabaseLayer_AdminController _databaseLayer;
        private readonly IDatabaseLayer_AuthController _authDatabaseLayer;

        public BusinessLayer_AdminController(
            IDatabaseLayer_AdminController databaseLayer,
            IDatabaseLayer_AuthController authDatabaseLayer)
        {
            this._databaseLayer = databaseLayer;
            this._authDatabaseLayer = authDatabaseLayer;
        }

        private async Task<bool> IsAdminUserAsync(string userId)
        {
            var user = await _authDatabaseLayer.GetUserByIdAsync(userId);
            return user != null && user.Role.Equals("superadmin", StringComparison.OrdinalIgnoreCase);
        }

        public async Task<ApiResponse<AdminStatsDto>> GetDashboardStatsAsync(string adminUserId)
        {
            if (!await IsAdminUserAsync(adminUserId))
                return ApiResponse<AdminStatsDto>.Fail("Unauthorized access. Admin role required.");

            var stats = await _databaseLayer.GetDashboardStatsAsync();
            await _databaseLayer.WriteAuditLogAsync(adminUserId, "VIEW_STATS", "Admin viewed global dashboard stats");
            return ApiResponse<AdminStatsDto>.Ok(stats);
        }

        public async Task<ApiResponse<List<VendorDb>>> GetPendingVendorsAsync(string adminUserId)
        {
            if (!await IsAdminUserAsync(adminUserId))
                return ApiResponse<List<VendorDb>>.Fail("Unauthorized access. Admin role required.");

            var list = await _databaseLayer.GetPendingVendorsAsync();
            return ApiResponse<List<VendorDb>>.Ok(list);
        }

        public async Task<ApiResponse<bool>> ApproveVendorAsync(string adminUserId, string vendorId, string status)
        {
            if (!await IsAdminUserAsync(adminUserId))
                return ApiResponse<bool>.Fail("Unauthorized access. Admin role required.");

            var success = await _databaseLayer.ApproveVendorAsync(vendorId, status);
            if (!success) return ApiResponse<bool>.Fail("Failed to process vendor approval.");

            await _databaseLayer.WriteAuditLogAsync(adminUserId, "VENDOR_APPROVAL", $"Admin {status} vendor {vendorId}");
            return ApiResponse<bool>.Ok(true, $"Vendor status set to {status} successfully.");
        }

        public async Task<ApiResponse<bool>> ApproveRiderAsync(string adminUserId, string riderId, bool isApproved)
        {
            if (!await IsAdminUserAsync(adminUserId))
                return ApiResponse<bool>.Fail("Unauthorized access. Admin role required.");

            var success = await _databaseLayer.ApproveRiderAsync(riderId, isApproved);
            if (!success) return ApiResponse<bool>.Fail("Failed to update rider approval status.");

            await _databaseLayer.WriteAuditLogAsync(adminUserId, "RIDER_APPROVAL", $"Admin set rider {riderId} approval to {isApproved}");
            return ApiResponse<bool>.Ok(true, "Rider approval status updated successfully.");
        }

        public async Task<ApiResponse<List<SettlementDb>>> GetAllSettlementsAsync(string adminUserId)
        {
            if (!await IsAdminUserAsync(adminUserId))
                return ApiResponse<List<SettlementDb>>.Fail("Unauthorized access. Admin role required.");

            var list = await _databaseLayer.GetAllSettlementsAsync();
            return ApiResponse<List<SettlementDb>>.Ok(list);
        }

        public async Task<ApiResponse<SettlementDb>> CreateSettlementAsync(string adminUserId, SettlementDb settlement)
        {
            if (!await IsAdminUserAsync(adminUserId))
                return ApiResponse<SettlementDb>.Fail("Unauthorized access. Admin role required.");

            settlement.Id = "SET-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
            settlement.Status = "pending";

            var success = await _databaseLayer.CreateSettlementAsync(settlement);
            if (!success) return ApiResponse<SettlementDb>.Fail("Failed to log settlement request.");

            await _databaseLayer.WriteAuditLogAsync(adminUserId, "CREATE_SETTLEMENT", $"Admin created pending settlement of ₹{settlement.Amount} for {settlement.UserType} {settlement.UserId}");
            return ApiResponse<SettlementDb>.Ok(settlement, "Pending settlement logged successfully.");
        }

        public async Task<ApiResponse<bool>> UpdateSettlementStatusAsync(string adminUserId, string settlementId, string status, string txDetails)
        {
            if (!await IsAdminUserAsync(adminUserId))
                return ApiResponse<bool>.Fail("Unauthorized access. Admin role required.");

            var success = await _databaseLayer.UpdateSettlementStatusAsync(settlementId, status, txDetails);
            if (!success) return ApiResponse<bool>.Fail("Failed to update settlement status.");

            await _databaseLayer.WriteAuditLogAsync(adminUserId, "UPDATE_SETTLEMENT", $"Admin updated settlement {settlementId} status to {status}");
            return ApiResponse<bool>.Ok(true, "Settlement status updated successfully.");
        }

        public async Task<ApiResponse<List<BannerDb>>> GetActiveBannersAsync()
        {
            var list = await _databaseLayer.GetActiveBannersAsync();
            return ApiResponse<List<BannerDb>>.Ok(list);
        }

        public async Task<ApiResponse<BannerDb>> UploadBannerAsync(string adminUserId, BannerDb banner)
        {
            if (!await IsAdminUserAsync(adminUserId))
                return ApiResponse<BannerDb>.Fail("Unauthorized access. Admin role required.");

            banner.Id = "BAN-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
            var success = await _databaseLayer.InsertBannerAsync(banner);
            if (!success) return ApiResponse<BannerDb>.Fail("Failed to upload promotional banner.");

            await _databaseLayer.WriteAuditLogAsync(adminUserId, "UPLOAD_BANNER", $"Admin uploaded new banner {banner.Id}");
            return ApiResponse<BannerDb>.Ok(banner, "Promotional banner uploaded successfully.");
        }

        public async Task<ApiResponse<bool>> TruncateAllTablesAsync(string adminUserId)
        {
            if (!await IsAdminUserAsync(adminUserId))
                return ApiResponse<bool>.Fail("Unauthorized access. Admin role required.");

            var success = await _databaseLayer.TruncateAllTablesAsync();
            if (!success) return ApiResponse<bool>.Fail("Failed to truncate database tables.");

            await _databaseLayer.WriteAuditLogAsync(adminUserId, "TRUNCATE_DATABASE", "Admin reset/truncated all database tables");
            return ApiResponse<bool>.Ok(true, "All tables truncated and reset successfully.");
        }
    }
}
