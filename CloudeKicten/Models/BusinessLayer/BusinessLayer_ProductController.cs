using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CloudeKicten.Models.DatabaseLayer;

namespace CloudeKicten.Models.BusinessLayer
{
    public interface IBusinessLayer_ProductController
    {
        Task<ApiResponse<List<ProductDb>>> GetAllProductsAsync();
        Task<ApiResponse<List<ProductDb>>> GetProductsByKitchenIdAsync(string kitchenId);
        Task<ApiResponse<ProductDb>> GetProductByIdAsync(string id);
        Task<ApiResponse<ProductDb>> CreateProductAsync(ProductCreateDto dto);
        Task<ApiResponse<ProductDb>> UpdateProductAsync(string id, ProductUpdateDto dto);
        Task<ApiResponse<bool>> DeleteProductAsync(string id);
    }

    public class BusinessLayer_ProductController : IBusinessLayer_ProductController
    {
        private readonly IDatabaseLayer_ProductController _databaseLayer;
        private readonly IDatabaseLayer_KitchenController _kitchenDatabaseLayer;

        public BusinessLayer_ProductController(
            IDatabaseLayer_ProductController databaseLayer, 
            IDatabaseLayer_KitchenController kitchenDatabaseLayer)
        {
            this._databaseLayer = databaseLayer;
            this._kitchenDatabaseLayer = kitchenDatabaseLayer;
        }

        public async Task<ApiResponse<List<ProductDb>>> GetAllProductsAsync()
        {
            var list = await _databaseLayer.GetAllProductsAsync();
            return ApiResponse<List<ProductDb>>.Ok(list);
        }

        public async Task<ApiResponse<List<ProductDb>>> GetProductsByKitchenIdAsync(string kitchenId)
        {
            var list = await _databaseLayer.GetProductsByKitchenIdAsync(kitchenId);
            return ApiResponse<List<ProductDb>>.Ok(list);
        }

        public async Task<ApiResponse<ProductDb>> GetProductByIdAsync(string id)
        {
            var product = await _databaseLayer.GetProductByIdAsync(id);
            if (product == null) return ApiResponse<ProductDb>.Fail("Product not found.");
            return ApiResponse<ProductDb>.Ok(product);
        }

        public async Task<ApiResponse<ProductDb>> CreateProductAsync(ProductCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return ApiResponse<ProductDb>.Fail("Product name is required.");

            var kitchen = await _kitchenDatabaseLayer.GetKitchenByIdAsync(dto.KitchenId);
            if (kitchen == null)
                return ApiResponse<ProductDb>.Fail($"Kitchen with ID '{dto.KitchenId}' does not exist.");

            var product = new ProductDb
            {
                Id = "p" + Guid.NewGuid().ToString("N").Substring(0, 6),
                KitchenId = dto.KitchenId,
                Name = dto.Name,
                Price = dto.Price,
                Description = dto.Description,
                Category = dto.Category,
                IsVeg = dto.IsVeg,
                Image = dto.Image ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80",
                Customizable = dto.Customizable,
                AvailableDays = dto.AvailableDays ?? "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday"
            };

            await _databaseLayer.InsertProductAsync(product);
            return ApiResponse<ProductDb>.Ok(product, "Product created successfully.");
        }

        public async Task<ApiResponse<ProductDb>> UpdateProductAsync(string id, ProductUpdateDto dto)
        {
            var product = await _databaseLayer.GetProductByIdAsync(id);
            if (product == null) return ApiResponse<ProductDb>.Fail("Product not found.");

            product.Name = dto.Name;
            product.Price = dto.Price;
            product.Description = dto.Description;
            product.Category = dto.Category;
            product.IsVeg = dto.IsVeg;
            product.Image = dto.Image ?? product.Image;
            product.Customizable = dto.Customizable;
            product.AvailableDays = dto.AvailableDays ?? product.AvailableDays;

            await _databaseLayer.UpdateProductAsync(id, product);
            return ApiResponse<ProductDb>.Ok(product, "Product updated successfully.");
        }

        public async Task<ApiResponse<bool>> DeleteProductAsync(string id)
        {
            var product = await _databaseLayer.GetProductByIdAsync(id);
            if (product == null) return ApiResponse<bool>.Fail("Product not found.");

            var result = await _databaseLayer.DeleteProductAsync(id);
            return ApiResponse<bool>.Ok(result, "Product deleted successfully.");
        }
    }
}
