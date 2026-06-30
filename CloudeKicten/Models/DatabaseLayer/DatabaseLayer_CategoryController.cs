using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace CloudeKicten.Models.DatabaseLayer
{
    public interface IDatabaseLayer_CategoryController
    {
        Task<List<CategoryDb>> GetAllCategoriesAsync();
        Task<CategoryDb?> GetCategoryByIdAsync(string id);
        Task<bool> InsertCategoryAsync(CategoryDb category);
        Task<bool> UpdateCategoryAsync(string id, CategoryDb category);
        Task<bool> DeleteCategoryAsync(string id);
    }

    public class DatabaseLayer_CategoryController : IDatabaseLayer_CategoryController
    {
        private readonly IConfiguration _configuration;
        private readonly string DbConnection;

        public DatabaseLayer_CategoryController(IConfiguration configuration)
        {
            this._configuration = configuration;
            this.DbConnection = this._configuration.GetConnectionString("AppDbContext") 
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found.");
        }

        private NpgsqlConnection GetConnection() => new NpgsqlConnection(DbConnection);

        public async Task<List<CategoryDb>> GetAllCategoriesAsync()
        {
            var list = new List<CategoryDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("SELECT id, name, image_url, is_active, created_at FROM categories WHERE is_active = TRUE ORDER BY name ASC;", conn);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new CategoryDb
                {
                    Id = reader.GetString(reader.GetOrdinal("id")),
                    Name = reader.GetString(reader.GetOrdinal("name")),
                    Image = reader.IsDBNull(reader.GetOrdinal("image_url")) ? null : reader.GetString(reader.GetOrdinal("image_url")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("is_active")),
                    CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at"))
                });
            }
            return list;
        }

        public async Task<CategoryDb?> GetCategoryByIdAsync(string id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("SELECT id, name, image_url, is_active, created_at FROM categories WHERE id = @Id;", conn);
            cmd.Parameters.AddWithValue("@Id", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new CategoryDb
                {
                    Id = reader.GetString(reader.GetOrdinal("id")),
                    Name = reader.GetString(reader.GetOrdinal("name")),
                    Image = reader.IsDBNull(reader.GetOrdinal("image_url")) ? null : reader.GetString(reader.GetOrdinal("image_url")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("is_active")),
                    CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at"))
                };
            }
            return null;
        }

        public async Task<bool> InsertCategoryAsync(CategoryDb cat)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("INSERT INTO categories (id, name, image_url, is_active, created_at) VALUES (@Id, @Name, @Image, @IsActive, CURRENT_TIMESTAMP);", conn);
            cmd.Parameters.AddWithValue("@Id", cat.Id);
            cmd.Parameters.AddWithValue("@Name", cat.Name);
            cmd.Parameters.AddWithValue("@Image", (object?)cat.Image ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IsActive", cat.IsActive);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> UpdateCategoryAsync(string id, CategoryDb cat)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("UPDATE categories SET name = @Name, image_url = @Image, is_active = @IsActive WHERE id = @Id;", conn);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@Name", cat.Name);
            cmd.Parameters.AddWithValue("@Image", (object?)cat.Image ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IsActive", cat.IsActive);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> DeleteCategoryAsync(string id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("DELETE FROM categories WHERE id = @Id;", conn);
            cmd.Parameters.AddWithValue("@Id", id);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }
    }

    public class CategoryDb
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Image { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
