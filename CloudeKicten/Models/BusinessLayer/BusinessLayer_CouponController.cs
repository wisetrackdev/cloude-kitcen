using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CloudeKicten.Models.DatabaseLayer;

namespace CloudeKicten.Models.BusinessLayer
{
    public interface IBusinessLayer_CouponController
    {
        Task<ApiResponse<List<CouponDb>>> GetActiveCouponsAsync(string? kitchenId);
        Task<ApiResponse<CouponDb>> CreateCouponAsync(CouponDb coupon);
        Task<ApiResponse<CouponDb>> ApplyCouponAsync(string code, decimal orderTotal);
    }

    public class BusinessLayer_CouponController : IBusinessLayer_CouponController
    {
        private readonly IDatabaseLayer_CouponController _databaseLayer;

        public BusinessLayer_CouponController(IDatabaseLayer_CouponController databaseLayer)
        {
            this._databaseLayer = databaseLayer;
        }

        public async Task<ApiResponse<List<CouponDb>>> GetActiveCouponsAsync(string? kitchenId)
        {
            var list = await _databaseLayer.GetAllActiveCouponsAsync();
            if (!string.IsNullOrEmpty(kitchenId))
            {
                list = list.FindAll(c => c.KitchenId == kitchenId);
            }
            return ApiResponse<List<CouponDb>>.Ok(list);
        }

        public async Task<ApiResponse<CouponDb>> CreateCouponAsync(CouponDb coupon)
        {
            coupon.Id = "CPN-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
            coupon.Code = coupon.Code.Trim().ToUpper();
            var success = await _databaseLayer.InsertCouponAsync(coupon);
            if (!success) return ApiResponse<CouponDb>.Fail("Failed to create coupon.");
            return ApiResponse<CouponDb>.Ok(coupon, "Promo coupon created successfully.");
        }

        public async Task<ApiResponse<CouponDb>> ApplyCouponAsync(string code, decimal orderTotal)
        {
            var coupon = await _databaseLayer.GetCouponByCodeAsync(code);
            if (coupon == null || !coupon.IsActive)
            {
                return ApiResponse<CouponDb>.Fail("Invalid or inactive coupon code.");
            }

            if (coupon.ExpiryDate < DateTime.UtcNow)
            {
                return ApiResponse<CouponDb>.Fail("Coupon code has expired.");
            }

            if (orderTotal < coupon.MinOrder)
            {
                return ApiResponse<CouponDb>.Fail($"Minimum order amount of ₹{coupon.MinOrder} required to apply this coupon.");
            }

            return ApiResponse<CouponDb>.Ok(coupon, "Coupon applied successfully!");
        }
    }
}
