using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace CloudeKicten.Models.DatabaseLayer
{
    public interface IDatabaseLayer_KitchenController
    {
        Task<List<KitchenDb>> GetAllKitchensAsync();
        Task<KitchenDb?> GetKitchenByIdAsync(string id);
        Task<bool> InsertKitchenAsync(KitchenDb kitchen);
        Task<bool> UpdateKitchenAsync(string id, KitchenDb kitchen);
        Task<bool> DeleteKitchenAsync(string id);
        Task<bool> UpdateKitchenStatsAsync(string id, decimal totalAmount);
    }

    public class DatabaseLayer_KitchenController : IDatabaseLayer_KitchenController
    {
        private readonly IConfiguration _configuration;
        private readonly string DbConnection;

        public DatabaseLayer_KitchenController(IConfiguration configuration)
        {
            this._configuration = configuration;
            this.DbConnection = this._configuration.GetConnectionString("AppDbContext") 
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found.");
        }

        private NpgsqlConnection GetConnection() => new NpgsqlConnection(DbConnection);

        public async Task<List<KitchenDb>> GetAllKitchensAsync()
        {
            var list = new List<KitchenDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetAllKitchens, conn);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(MapKitchen(reader));
            }
            return list;
        }

        public async Task<KitchenDb?> GetKitchenByIdAsync(string id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetKitchenById, conn);
            cmd.Parameters.AddWithValue("@Id", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapKitchen(reader);
            }
            return null;
        }

        public async Task<bool> InsertKitchenAsync(KitchenDb kitchen)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.InsertKitchen, conn);
            cmd.Parameters.AddWithValue("@Id", kitchen.Id);
            cmd.Parameters.AddWithValue("@Name", kitchen.Name);
            cmd.Parameters.AddWithValue("@OwnerId", kitchen.OwnerId);
            cmd.Parameters.AddWithValue("@Type", kitchen.Type);
            cmd.Parameters.AddWithValue("@Cuisines", kitchen.Cuisines);
            cmd.Parameters.AddWithValue("@Rating", kitchen.Rating);
            cmd.Parameters.AddWithValue("@RatingCount", kitchen.RatingCount);
            cmd.Parameters.AddWithValue("@Time", kitchen.Time);
            cmd.Parameters.AddWithValue("@Distance", kitchen.Distance);
            cmd.Parameters.AddWithValue("@Offer", (object?)kitchen.Offer ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Image", (object?)kitchen.Image ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Revenue", kitchen.Revenue);
            cmd.Parameters.AddWithValue("@OrdersCount", kitchen.OrdersCount);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> UpdateKitchenAsync(string id, KitchenDb kitchen)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.UpdateKitchen, conn);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@Name", kitchen.Name);
            cmd.Parameters.AddWithValue("@Type", kitchen.Type);
            cmd.Parameters.AddWithValue("@Cuisines", kitchen.Cuisines);
            cmd.Parameters.AddWithValue("@Time", kitchen.Time);
            cmd.Parameters.AddWithValue("@Distance", kitchen.Distance);
            cmd.Parameters.AddWithValue("@Offer", (object?)kitchen.Offer ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Image", (object?)kitchen.Image ?? DBNull.Value);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> DeleteKitchenAsync(string id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.DeleteKitchen, conn);
            cmd.Parameters.AddWithValue("@Id", id);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> UpdateKitchenStatsAsync(string id, decimal totalAmount)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.UpdateKitchenStats, conn);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@TotalAmount", totalAmount);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        private static KitchenDb MapKitchen(NpgsqlDataReader r)
        {
            return new KitchenDb
            {
                Id = r.GetString(r.GetOrdinal("id")),
                Name = r.GetString(r.GetOrdinal("name")),
                OwnerId = r.GetString(r.GetOrdinal("vendor_id")),
                Type = r.GetString(r.GetOrdinal("type")),
                Cuisines = r.GetString(r.GetOrdinal("cuisines")),
                Rating = r.GetDecimal(r.GetOrdinal("rating")),
                RatingCount = r.GetInt32(r.GetOrdinal("rating_count")),
                Time = r.GetString(r.GetOrdinal("prep_time")),
                Distance = r.GetString(r.GetOrdinal("distance")),
                Offer = r.IsDBNull(r.GetOrdinal("offer")) ? null : r.GetString(r.GetOrdinal("offer")),
                Image = r.IsDBNull(r.GetOrdinal("image_url")) ? null : r.GetString(r.GetOrdinal("image_url")),
                Revenue = r.GetDecimal(r.GetOrdinal("revenue")),
                OrdersCount = r.GetInt32(r.GetOrdinal("orders_count")),
                CreatedAt = r.GetDateTime(r.GetOrdinal("created_at"))
            };
        }
    }
}
