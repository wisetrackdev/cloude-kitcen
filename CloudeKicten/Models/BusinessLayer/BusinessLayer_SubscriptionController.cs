using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CloudeKicten.Models.DatabaseLayer;

namespace CloudeKicten.Models.BusinessLayer
{
    public interface IBusinessLayer_SubscriptionController
    {
        Task<ApiResponse<List<SubscriptionResponseDto>>> GetAllSubscriptionsAsync();
        Task<ApiResponse<List<SubscriptionResponseDto>>> GetSubscriptionsByCustomerIdAsync(string customerId);
        Task<ApiResponse<List<SubscriptionResponseDto>>> GetSubscriptionsByKitchenIdAsync(string kitchenId);
        Task<ApiResponse<SubscriptionResponseDto>> GetSubscriptionByIdAsync(string id);
        Task<ApiResponse<SubscriptionResponseDto>> CreateSubscriptionAsync(SubscriptionCreateDto dto);
        Task<ApiResponse<SubscriptionResponseDto>> UpdateSubscriptionStatusAsync(string id, string status);
    }

    public class BusinessLayer_SubscriptionController : IBusinessLayer_SubscriptionController
    {
        private readonly IDatabaseLayer_SubscriptionController _databaseLayer;
        private readonly IDatabaseLayer_KitchenController _kitchenDatabaseLayer;
        private readonly IDatabaseLayer_AuthController _authDatabaseLayer;

        public BusinessLayer_SubscriptionController(
            IDatabaseLayer_SubscriptionController databaseLayer,
            IDatabaseLayer_KitchenController kitchenDatabaseLayer,
            IDatabaseLayer_AuthController authDatabaseLayer)
        {
            this._databaseLayer = databaseLayer;
            this._kitchenDatabaseLayer = kitchenDatabaseLayer;
            this._authDatabaseLayer = authDatabaseLayer;
        }

        public async Task<ApiResponse<List<SubscriptionResponseDto>>> GetAllSubscriptionsAsync()
        {
            var list = await _databaseLayer.GetAllSubscriptionsAsync();
            var res = new List<SubscriptionResponseDto>();
            foreach (var s in list)
            {
                res.Add(await MapToDto(s));
            }
            return ApiResponse<List<SubscriptionResponseDto>>.Ok(res);
        }

        public async Task<ApiResponse<List<SubscriptionResponseDto>>> GetSubscriptionsByCustomerIdAsync(string customerId)
        {
            var list = await _databaseLayer.GetSubscriptionsByCustomerIdAsync(customerId);
            var res = new List<SubscriptionResponseDto>();
            foreach (var s in list)
            {
                res.Add(await MapToDto(s));
            }
            return ApiResponse<List<SubscriptionResponseDto>>.Ok(res);
        }

        public async Task<ApiResponse<List<SubscriptionResponseDto>>> GetSubscriptionsByKitchenIdAsync(string kitchenId)
        {
            var list = await _databaseLayer.GetSubscriptionsByKitchenIdAsync(kitchenId);
            var res = new List<SubscriptionResponseDto>();
            foreach (var s in list)
            {
                res.Add(await MapToDto(s));
            }
            return ApiResponse<List<SubscriptionResponseDto>>.Ok(res);
        }

        public async Task<ApiResponse<SubscriptionResponseDto>> GetSubscriptionByIdAsync(string id)
        {
            var s = await _databaseLayer.GetSubscriptionByIdAsync(id);
            if (s == null) return ApiResponse<SubscriptionResponseDto>.Fail("Subscription not found.");
            var res = await MapToDto(s);
            return ApiResponse<SubscriptionResponseDto>.Ok(res);
        }

        public async Task<ApiResponse<SubscriptionResponseDto>> CreateSubscriptionAsync(SubscriptionCreateDto dto)
        {
            var customer = await _authDatabaseLayer.GetUserByIdAsync(dto.CustomerId);
            if (customer == null)
                return ApiResponse<SubscriptionResponseDto>.Fail($"Customer ID '{dto.CustomerId}' not found.");

            var kitchen = await _kitchenDatabaseLayer.GetKitchenByIdAsync(dto.KitchenId);
            if (kitchen == null)
                return ApiResponse<SubscriptionResponseDto>.Fail($"Kitchen ID '{dto.KitchenId}' not found.");

            string id = "SUB-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
            DateTime startDate = DateTime.UtcNow;
            DateTime endDate = startDate.AddDays(dto.DurationDays);

            var s = new SubscriptionDb
            {
                Id = id,
                CustomerId = dto.CustomerId,
                KitchenId = dto.KitchenId,
                PlanName = dto.PlanName,
                Frequency = dto.Frequency,
                DurationDays = dto.DurationDays,
                MealsSelected = dto.MealsSelected,
                StartDate = startDate,
                EndDate = endDate,
                Price = dto.Price,
                PaidAmount = dto.PaidAmount,
                PaymentStatus = dto.PaymentStatus,
                Status = "active"
            };

            await _databaseLayer.InsertSubscriptionAsync(s);
            
            // Add points to customer for meal subscriptions
            customer.RewardPoints += 50;
            await _authDatabaseLayer.UpdateUserProfileAsync(customer);

            var res = await MapToDto(s);
            return ApiResponse<SubscriptionResponseDto>.Ok(res, "Meal plan subscription activated successfully.");
        }

        public async Task<ApiResponse<SubscriptionResponseDto>> UpdateSubscriptionStatusAsync(string id, string status)
        {
            var s = await _databaseLayer.GetSubscriptionByIdAsync(id);
            if (s == null) return ApiResponse<SubscriptionResponseDto>.Fail("Subscription not found.");

            await _databaseLayer.UpdateSubscriptionStatusAsync(id, status);
            s.Status = status;

            var res = await MapToDto(s);
            return ApiResponse<SubscriptionResponseDto>.Ok(res, "Subscription status updated successfully.");
        }

        private async Task<SubscriptionResponseDto> MapToDto(SubscriptionDb s)
        {
            var customer = await _authDatabaseLayer.GetUserByIdAsync(s.CustomerId);
            var kitchen = await _kitchenDatabaseLayer.GetKitchenByIdAsync(s.KitchenId);

            return new SubscriptionResponseDto
            {
                Id = s.Id,
                CustomerId = s.CustomerId,
                CustomerName = customer != null ? $"{customer.FirstName} {customer.LastName}".Trim() : "Unknown Customer",
                KitchenId = s.KitchenId,
                KitchenName = kitchen?.Name ?? "Unknown Kitchen",
                PlanName = s.PlanName,
                Frequency = s.Frequency,
                DurationDays = s.DurationDays,
                MealsSelected = s.MealsSelected,
                StartDate = s.StartDate.ToString("dd MMM yyyy"),
                EndDate = s.EndDate.ToString("dd MMM yyyy"),
                Price = s.Price,
                PaidAmount = s.PaidAmount,
                PaymentStatus = s.PaymentStatus,
                Status = s.Status
            };
        }
    }
}
