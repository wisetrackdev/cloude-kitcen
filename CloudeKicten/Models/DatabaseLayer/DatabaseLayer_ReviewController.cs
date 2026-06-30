using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace CloudeKicten.Models.DatabaseLayer
{
    public interface IDatabaseLayer_ReviewController
    {
        Task<List<ReviewDb>> GetReviewsByKitchenIdAsync(string kitchenId);
        Task<bool> InsertReviewAsync(ReviewDb review);
    }

    public class DatabaseLayer_ReviewController : IDatabaseLayer_ReviewController
    {
        private readonly IConfiguration _configuration;
        private readonly string DbConnection;

        public DatabaseLayer_ReviewController(IConfiguration configuration)
        {
            this._configuration = configuration;
            this.DbConnection = this._configuration.GetConnectionString("AppDbContext") 
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found.");
        }

        private NpgsqlConnection GetConnection() => new NpgsqlConnection(DbConnection);

        public async Task<List<ReviewDb>> GetReviewsByKitchenIdAsync(string kitchenId)
        {
            var list = new List<ReviewDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetReviewsByKitchenId, conn);
            cmd.Parameters.AddWithValue("@KitchenId", kitchenId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new ReviewDb
                {
                    Id = reader.GetString(reader.GetOrdinal("id")),
                    OrderId = reader.GetString(reader.GetOrdinal("order_id")),
                    CustomerId = reader.GetString(reader.GetOrdinal("customer_id")),
                    KitchenId = reader.GetString(reader.GetOrdinal("kitchen_id")),
                    Rating = reader.GetInt32(reader.GetOrdinal("rating")),
                    Comment = reader.IsDBNull(reader.GetOrdinal("comment")) ? null : reader.GetString(reader.GetOrdinal("comment")),
                    CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at"))
                });
            }
            return list;
        }

        public async Task<bool> InsertReviewAsync(ReviewDb r)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.InsertReview, conn);
            cmd.Parameters.AddWithValue("@Id", r.Id);
            cmd.Parameters.AddWithValue("@OrderId", r.OrderId);
            cmd.Parameters.AddWithValue("@CustomerId", r.CustomerId);
            cmd.Parameters.AddWithValue("@KitchenId", r.KitchenId);
            cmd.Parameters.AddWithValue("@Rating", r.Rating);
            cmd.Parameters.AddWithValue("@Comment", (object?)r.Comment ?? DBNull.Value);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }
    }

    public class ReviewDb
    {
        public string Id { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string KitchenId { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
