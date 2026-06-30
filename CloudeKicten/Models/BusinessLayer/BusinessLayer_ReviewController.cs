using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CloudeKicten.Models.DatabaseLayer;

namespace CloudeKicten.Models.BusinessLayer
{
    public interface IBusinessLayer_ReviewController
    {
        Task<ApiResponse<List<ReviewDb>>> GetReviewsByKitchenIdAsync(string kitchenId);
        Task<ApiResponse<ReviewDb>> SubmitReviewAsync(ReviewDb review);
    }

    public class BusinessLayer_ReviewController : IBusinessLayer_ReviewController
    {
        private readonly IDatabaseLayer_ReviewController _databaseLayer;
        private readonly IDatabaseLayer_KitchenController _kitchenDatabase;

        public BusinessLayer_ReviewController(
            IDatabaseLayer_ReviewController databaseLayer,
            IDatabaseLayer_KitchenController kitchenDatabase)
        {
            this._databaseLayer = databaseLayer;
            this._kitchenDatabase = kitchenDatabase;
        }

        public async Task<ApiResponse<List<ReviewDb>>> GetReviewsByKitchenIdAsync(string kitchenId)
        {
            var list = await _databaseLayer.GetReviewsByKitchenIdAsync(kitchenId);
            return ApiResponse<List<ReviewDb>>.Ok(list);
        }

        public async Task<ApiResponse<ReviewDb>> SubmitReviewAsync(ReviewDb review)
        {
            review.Id = "REV-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
            var success = await _databaseLayer.InsertReviewAsync(review);
            if (!success) return ApiResponse<ReviewDb>.Fail("Failed to submit review.");

            // Recalculate and update the kitchen's average rating in the Shops table
            var kitchen = await _kitchenDatabase.GetKitchenByIdAsync(review.KitchenId);
            if (kitchen != null)
            {
                var reviews = await _databaseLayer.GetReviewsByKitchenIdAsync(review.KitchenId);
                decimal sum = 0;
                foreach (var r in reviews)
                {
                    sum += r.Rating;
                }
                kitchen.RatingCount = reviews.Count;
                kitchen.Rating = reviews.Count > 0 ? Math.Round(sum / reviews.Count, 1) : 5.0m;

                await _kitchenDatabase.UpdateKitchenAsync(review.KitchenId, kitchen);
            }

            return ApiResponse<ReviewDb>.Ok(review, "Thank you! Review submitted successfully.");
        }
    }
}
