using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace CloudeKicten.Models.DatabaseLayer
{
    public interface IDatabaseLayer_ProductController
    {
        Task<List<ProductDb>> GetAllProductsAsync();
        Task<List<ProductDb>> GetProductsByKitchenIdAsync(string kitchenId);
        Task<ProductDb?> GetProductByIdAsync(string id);
        Task<bool> InsertProductAsync(ProductDb product);
        Task<bool> UpdateProductAsync(string id, ProductDb product);
        Task<bool> DeleteProductAsync(string id);
    }

    public class DatabaseLayer_ProductController : IDatabaseLayer_ProductController
    {
        private readonly IConfiguration _configuration;
        private readonly string DbConnection;

        public DatabaseLayer_ProductController(IConfiguration configuration)
        {
            this._configuration = configuration;
            this.DbConnection = this._configuration.GetConnectionString("AppDbContext") 
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found.");
        }

        private NpgsqlConnection GetConnection() => new NpgsqlConnection(DbConnection);

        public async Task<List<ProductDb>> GetAllProductsAsync()
        {
            var list = new List<ProductDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetAllProducts, conn);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(MapProduct(reader));
            }
            return list;
        }

        public async Task<List<ProductDb>> GetProductsByKitchenIdAsync(string kitchenId)
        {
            var list = new List<ProductDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetProductsByKitchenId, conn);
            cmd.Parameters.AddWithValue("@KitchenId", kitchenId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(MapProduct(reader));
            }
            return list;
        }

        public async Task<ProductDb?> GetProductByIdAsync(string id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetProductById, conn);
            cmd.Parameters.AddWithValue("@Id", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapProduct(reader);
            }
            return null;
        }

        public async Task<bool> InsertProductAsync(ProductDb product)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.InsertProduct, conn);
            cmd.Parameters.AddWithValue("@Id", product.Id);
            cmd.Parameters.AddWithValue("@KitchenId", product.KitchenId);
            cmd.Parameters.AddWithValue("@Name", product.Name);
            cmd.Parameters.AddWithValue("@Price", product.Price);
            cmd.Parameters.AddWithValue("@Description", (object?)product.Description ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Category", product.Category);
            cmd.Parameters.AddWithValue("@IsVeg", product.IsVeg);
            cmd.Parameters.AddWithValue("@Image", (object?)product.Image ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Customizable", product.Customizable);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> UpdateProductAsync(string id, ProductDb product)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.UpdateProduct, conn);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@Name", product.Name);
            cmd.Parameters.AddWithValue("@Price", product.Price);
            cmd.Parameters.AddWithValue("@Description", (object?)product.Description ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Category", product.Category);
            cmd.Parameters.AddWithValue("@IsVeg", product.IsVeg);
            cmd.Parameters.AddWithValue("@Image", (object?)product.Image ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Customizable", product.Customizable);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> DeleteProductAsync(string id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.DeleteProduct, conn);
            cmd.Parameters.AddWithValue("@Id", id);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        private static ProductDb MapProduct(NpgsqlDataReader r)
        {
            return new ProductDb
            {
                Id = r.GetString(r.GetOrdinal("id")),
                KitchenId = r.GetString(r.GetOrdinal("kitchen_id")),
                Name = r.GetString(r.GetOrdinal("name")),
                Price = r.GetDecimal(r.GetOrdinal("price")),
                Description = r.IsDBNull(r.GetOrdinal("description")) ? null : r.GetString(r.GetOrdinal("description")),
                Category = r.GetString(r.GetOrdinal("category_name")),
                IsVeg = r.GetBoolean(r.GetOrdinal("is_veg")),
                Image = r.IsDBNull(r.GetOrdinal("image_url")) ? null : r.GetString(r.GetOrdinal("image_url")),
                Customizable = r.GetBoolean(r.GetOrdinal("customizable")),
                CreatedAt = r.GetDateTime(r.GetOrdinal("created_at"))
            };
        }
    }
}
