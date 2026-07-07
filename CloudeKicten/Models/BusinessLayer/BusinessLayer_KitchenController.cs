using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CloudeKicten.Models.DatabaseLayer;

namespace CloudeKicten.Models.BusinessLayer
{
    public interface IBusinessLayer_KitchenController
    {
        Task<ApiResponse<List<KitchenDb>>> GetAllKitchensAsync();
        Task<ApiResponse<KitchenDb>> GetKitchenByIdAsync(string id);
        Task<ApiResponse<KitchenDb>> CreateKitchenAsync(KitchenCreateDto dto);
        Task<ApiResponse<KitchenDb>> UpdateKitchenAsync(string id, KitchenUpdateDto dto);
        Task<ApiResponse<bool>> DeleteKitchenAsync(string id);
    }

    public class BusinessLayer_KitchenController : IBusinessLayer_KitchenController
    {
        private readonly IDatabaseLayer_KitchenController _databaseLayer;
        private readonly IDatabaseLayer_AuthController _authDatabaseLayer;

        public BusinessLayer_KitchenController(
            IDatabaseLayer_KitchenController databaseLayer, 
            IDatabaseLayer_AuthController authDatabaseLayer)
        {
            this._databaseLayer = databaseLayer;
            this._authDatabaseLayer = authDatabaseLayer;
        }

        public async Task<ApiResponse<List<KitchenDb>>> GetAllKitchensAsync()
        {
            var list = await _databaseLayer.GetAllKitchensAsync();
            return ApiResponse<List<KitchenDb>>.Ok(list);
        }

        public async Task<ApiResponse<KitchenDb>> GetKitchenByIdAsync(string id)
        {
            var kitchen = await _databaseLayer.GetKitchenByIdAsync(id);
            if (kitchen == null) return ApiResponse<KitchenDb>.Fail("Kitchen not found.");
            return ApiResponse<KitchenDb>.Ok(kitchen);
        }

        public async Task<ApiResponse<KitchenDb>> CreateKitchenAsync(KitchenCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return ApiResponse<KitchenDb>.Fail("Kitchen name is required.");

            var owner = await _authDatabaseLayer.GetUserByIdAsync(dto.OwnerId);
            if (owner == null)
                return ApiResponse<KitchenDb>.Fail($"Owner with ID '{dto.OwnerId}' does not exist.");

            var kitchen = new KitchenDb
            {
                Id = "k" + Guid.NewGuid().ToString("N").Substring(0, 6),
                Name = dto.Name,
                OwnerId = dto.OwnerId,
                Type = dto.Type,
                Cuisines = dto.Cuisines,
                Rating = 5.0m,
                RatingCount = 0,
                Time = dto.Time,
                Distance = dto.Distance,
                Offer = dto.Offer,
                Image = dto.Image ?? "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
                LogoUrl = dto.LogoUrl,
                Address = dto.Address,
                Floor = dto.Floor,
                OfficeGaliNumber = dto.OfficeGaliNumber,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                IsApproved = dto.IsApproved ?? "pending",
                BankAccount = dto.BankAccount ?? "SBI A/C 30948576291",
                CoverImageUrl = dto.CoverImageUrl,
                BankName = dto.BankName,
                AccountNumber = dto.AccountNumber,
                IfscCode = dto.IfscCode,
                UtrNumber = dto.UtrNumber,
                PaymentScreenshot = dto.PaymentScreenshot,
                Revenue = 0.0m,
                OrdersCount = 0
            };

            await _databaseLayer.InsertKitchenAsync(kitchen);

            // Fire SuperAdmin notification
            try
            {
                var superAdmins = await _databaseLayer.GetSuperAdminIdsAsync();
                foreach (var adminId in superAdmins)
                {
                    await _databaseLayer.InsertNotificationAsync(
                        adminId,
                        "New Shop Request",
                        $"Cloud Kitchen registration request: '{kitchen.Name}' was created by '{owner.FirstName} {owner.LastName}' and requires SuperAdmin approval."
                    );
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to notify superadmins: {ex.Message}");
            }

            return ApiResponse<KitchenDb>.Ok(kitchen, "Kitchen created successfully.");
        }

        public async Task<ApiResponse<KitchenDb>> UpdateKitchenAsync(string id, KitchenUpdateDto dto)
        {
            var kitchen = await _databaseLayer.GetKitchenByIdAsync(id);
            if (kitchen == null) return ApiResponse<KitchenDb>.Fail("Kitchen not found.");

            kitchen.Name = dto.Name;
            kitchen.Type = dto.Type;
            kitchen.Cuisines = dto.Cuisines;
            kitchen.Time = dto.Time;
            kitchen.Distance = dto.Distance;
            kitchen.Offer = dto.Offer;
            kitchen.Image = dto.Image ?? kitchen.Image;
            kitchen.LogoUrl = dto.LogoUrl ?? kitchen.LogoUrl;
            kitchen.Address = dto.Address ?? kitchen.Address;
            kitchen.Floor = dto.Floor ?? kitchen.Floor;
            kitchen.OfficeGaliNumber = dto.OfficeGaliNumber ?? kitchen.OfficeGaliNumber;
            kitchen.Latitude = dto.Latitude ?? kitchen.Latitude;
            kitchen.Longitude = dto.Longitude ?? kitchen.Longitude;
            kitchen.IsApproved = dto.IsApproved ?? kitchen.IsApproved;
            kitchen.BankAccount = dto.BankAccount ?? kitchen.BankAccount;
            kitchen.CoverImageUrl = dto.CoverImageUrl ?? kitchen.CoverImageUrl;
            kitchen.BankName = dto.BankName ?? kitchen.BankName;
            kitchen.AccountNumber = dto.AccountNumber ?? kitchen.AccountNumber;
            kitchen.IfscCode = dto.IfscCode ?? kitchen.IfscCode;
            kitchen.UtrNumber = dto.UtrNumber ?? kitchen.UtrNumber;
            kitchen.PaymentScreenshot = dto.PaymentScreenshot ?? kitchen.PaymentScreenshot;

            await _databaseLayer.UpdateKitchenAsync(id, kitchen);
            return ApiResponse<KitchenDb>.Ok(kitchen, "Kitchen updated successfully.");
        }

        public async Task<ApiResponse<bool>> DeleteKitchenAsync(string id)
        {
            var kitchen = await _databaseLayer.GetKitchenByIdAsync(id);
            if (kitchen == null) return ApiResponse<bool>.Fail("Kitchen not found.");

            var result = await _databaseLayer.DeleteKitchenAsync(id);
            return ApiResponse<bool>.Ok(result, "Kitchen deleted successfully.");
        }
    }
}
