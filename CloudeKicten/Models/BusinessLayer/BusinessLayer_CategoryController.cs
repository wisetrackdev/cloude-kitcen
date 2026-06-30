using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CloudeKicten.Models.DatabaseLayer;

namespace CloudeKicten.Models.BusinessLayer
{
    public interface IBusinessLayer_CategoryController
    {
        Task<ApiResponse<List<CategoryDb>>> GetAllCategoriesAsync();
        Task<ApiResponse<CategoryDb>> GetCategoryByIdAsync(string id);
        Task<ApiResponse<CategoryDb>> CreateCategoryAsync(CategoryDb category);
        Task<ApiResponse<CategoryDb>> UpdateCategoryAsync(string id, CategoryDb category);
        Task<ApiResponse<bool>> DeleteCategoryAsync(string id);
    }

    public class BusinessLayer_CategoryController : IBusinessLayer_CategoryController
    {
        private readonly IDatabaseLayer_CategoryController _databaseLayer;

        public BusinessLayer_CategoryController(IDatabaseLayer_CategoryController databaseLayer)
        {
            this._databaseLayer = databaseLayer;
        }

        public async Task<ApiResponse<List<CategoryDb>>> GetAllCategoriesAsync()
        {
            var list = await _databaseLayer.GetAllCategoriesAsync();
            return ApiResponse<List<CategoryDb>>.Ok(list);
        }

        public async Task<ApiResponse<CategoryDb>> GetCategoryByIdAsync(string id)
        {
            var cat = await _databaseLayer.GetCategoryByIdAsync(id);
            if (cat == null) return ApiResponse<CategoryDb>.Fail("Category not found.");
            return ApiResponse<CategoryDb>.Ok(cat);
        }

        public async Task<ApiResponse<CategoryDb>> CreateCategoryAsync(CategoryDb category)
        {
            category.Id = "CAT-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
            var success = await _databaseLayer.InsertCategoryAsync(category);
            if (!success) return ApiResponse<CategoryDb>.Fail("Failed to create category.");
            return ApiResponse<CategoryDb>.Ok(category, "Category created successfully.");
        }

        public async Task<ApiResponse<CategoryDb>> UpdateCategoryAsync(string id, CategoryDb category)
        {
            var existing = await _databaseLayer.GetCategoryByIdAsync(id);
            if (existing == null) return ApiResponse<CategoryDb>.Fail("Category not found.");

            var success = await _databaseLayer.UpdateCategoryAsync(id, category);
            if (!success) return ApiResponse<CategoryDb>.Fail("Failed to update category.");
            category.Id = id;
            return ApiResponse<CategoryDb>.Ok(category, "Category updated successfully.");
        }

        public async Task<ApiResponse<bool>> DeleteCategoryAsync(string id)
        {
            var existing = await _databaseLayer.GetCategoryByIdAsync(id);
            if (existing == null) return ApiResponse<bool>.Fail("Category not found.");

            var success = await _databaseLayer.DeleteCategoryAsync(id);
            return ApiResponse<bool>.Ok(success, "Category deleted successfully.");
        }
    }
}
