using System;
using System.Threading.Tasks;
using CloudeKicten.Models.DatabaseLayer;

namespace CloudeKicten.Models.BusinessLayer
{
    public interface IBusinessLayer_RiderController
    {
        Task<ApiResponse<RiderDb>> GetRiderProfileAsync(string id);
        Task<ApiResponse<List<RiderDb>>> GetAllRidersAsync();
        Task<ApiResponse<RiderDb>> RegisterRiderAsync(RiderRegisterDto dto);
        Task<ApiResponse<RiderDb>> UpdateRiderProfileAsync(string id, RiderProfileUpdateDto dto);
        Task<ApiResponse<bool>> RateRiderAsync(string id, int rating);
        Task<ApiResponse<bool>> UpdateLocationAsync(string id, decimal latitude, decimal longitude);
        Task<ApiResponse<bool>> UpdateStatusAsync(string id, bool isActive);
    }

    public class BusinessLayer_RiderController : IBusinessLayer_RiderController
    {
        private readonly IDatabaseLayer_RiderController _databaseLayer;
        private readonly IDatabaseLayer_AuthController _authDatabaseLayer;

        public BusinessLayer_RiderController(
            IDatabaseLayer_RiderController databaseLayer,
            IDatabaseLayer_AuthController authDatabaseLayer)
        {
            this._databaseLayer = databaseLayer;
            this._authDatabaseLayer = authDatabaseLayer;
        }

        public async Task<ApiResponse<RiderDb>> GetRiderProfileAsync(string id)
        {
            var r = await _databaseLayer.GetRiderByIdAsync(id);
            if (r == null) return ApiResponse<RiderDb>.Fail("Rider profile not found.");
            return ApiResponse<RiderDb>.Ok(r);
        }

        public async Task<ApiResponse<List<RiderDb>>> GetAllRidersAsync()
        {
            var list = await _databaseLayer.GetAllRidersAsync();
            return ApiResponse<List<RiderDb>>.Ok(list);
        }

        public async Task<ApiResponse<RiderDb>> RegisterRiderAsync(RiderRegisterDto dto)
        {
            var user = await _authDatabaseLayer.GetUserByIdAsync(dto.UserId);
            if (user == null)
                return ApiResponse<RiderDb>.Fail("Associated user not found.");

            // Update user role to 'rider'
            user.Role = "rider";
            await _authDatabaseLayer.UpdateUserProfileAsync(user);

            var rider = new RiderDb
            {
                Id = dto.UserId,
                VehicleNumber = dto.VehicleNumber,
                LicenseNumber = dto.LicenseNumber,
                DeliveryZone = dto.DeliveryZone,
                RcNumber = dto.RcNumber,
                BankName = dto.BankName,
                AccountNumber = dto.AccountNumber,
                IfscCode = dto.IfscCode,
                IsActive = true
            };

            await _databaseLayer.InsertRiderAsync(rider);
            return ApiResponse<RiderDb>.Ok(rider, "Rider registered successfully.");
        }

        public async Task<ApiResponse<RiderDb>> UpdateRiderProfileAsync(string id, RiderProfileUpdateDto dto)
        {
            var rider = await _databaseLayer.GetRiderByIdAsync(id);
            if (rider == null) return ApiResponse<RiderDb>.Fail("Rider not found.");

            rider.VehicleNumber = dto.VehicleNumber;
            rider.LicenseNumber = dto.LicenseNumber;
            rider.RcNumber = dto.RcNumber ?? rider.RcNumber;
            rider.BankName = dto.BankName ?? rider.BankName;
            rider.AccountNumber = dto.AccountNumber ?? rider.AccountNumber;
            rider.IfscCode = dto.IfscCode ?? rider.IfscCode;
            rider.DeliveryZone = dto.DeliveryZone ?? rider.DeliveryZone;
            rider.Phone = dto.Phone ?? rider.Phone;
            rider.Gender = dto.Gender ?? rider.Gender;

            var success = await _databaseLayer.UpdateRiderProfileAsync(rider);
            if (!success) return ApiResponse<RiderDb>.Fail("Failed to update rider profile.");

            return ApiResponse<RiderDb>.Ok(rider, "Rider profile updated successfully.");
        }

        public async Task<ApiResponse<bool>> RateRiderAsync(string id, int rating)
        {
            var success = await _databaseLayer.UpdateRiderRatingAsync(id, rating);
            if (!success) return ApiResponse<bool>.Fail("Rider profile not found or rating update failed.");
            return ApiResponse<bool>.Ok(true, "Rider rated successfully.");
        }

        public async Task<ApiResponse<bool>> UpdateLocationAsync(string id, decimal latitude, decimal longitude)
        {
            var rider = await _databaseLayer.GetRiderByIdAsync(id);
            if (rider == null) return ApiResponse<bool>.Fail("Rider not found.");

            var res = await _databaseLayer.UpdateRiderLocationAsync(id, latitude, longitude);
            return ApiResponse<bool>.Ok(res, "Rider location updated successfully.");
        }

        public async Task<ApiResponse<bool>> UpdateStatusAsync(string id, bool isActive)
        {
            var rider = await _databaseLayer.GetRiderByIdAsync(id);
            if (rider == null) return ApiResponse<bool>.Fail("Rider not found.");

            var res = await _databaseLayer.UpdateRiderStatusAsync(id, isActive);
            return ApiResponse<bool>.Ok(res, "Rider active status updated successfully.");
        }
    }
}
