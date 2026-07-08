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
        Task<List<string>> GetSuperAdminIdsAsync();
        Task<bool> InsertNotificationAsync(string userId, string title, string body);
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
            cmd.Parameters.AddWithValue("@VendorId", kitchen.OwnerId);
            cmd.Parameters.AddWithValue("@Name", kitchen.Name);
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
            cmd.Parameters.AddWithValue("@LogoUrl", (object?)kitchen.LogoUrl ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Address", (object?)kitchen.Address ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Floor", (object?)kitchen.Floor ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@OfficeGaliNumber", (object?)kitchen.OfficeGaliNumber ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Latitude", (object?)kitchen.Latitude ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Longitude", (object?)kitchen.Longitude ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IsApproved", kitchen.IsApproved ?? "pending");
            cmd.Parameters.AddWithValue("@BankAccount", (object?)kitchen.BankAccount ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@CoverImageUrl", (object?)kitchen.CoverImageUrl ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@BankName", (object?)kitchen.BankName ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@AccountNumber", (object?)kitchen.AccountNumber ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IfscCode", (object?)kitchen.IfscCode ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@UtrNumber", (object?)kitchen.UtrNumber ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@PaymentScreenshot", (object?)kitchen.PaymentScreenshot ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IsLive", kitchen.IsLive);

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
            cmd.Parameters.AddWithValue("@LogoUrl", (object?)kitchen.LogoUrl ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Address", (object?)kitchen.Address ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Floor", (object?)kitchen.Floor ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@OfficeGaliNumber", (object?)kitchen.OfficeGaliNumber ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Latitude", (object?)kitchen.Latitude ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Longitude", (object?)kitchen.Longitude ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IsApproved", kitchen.IsApproved ?? "pending");
            cmd.Parameters.AddWithValue("@BankAccount", (object?)kitchen.BankAccount ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@CoverImageUrl", (object?)kitchen.CoverImageUrl ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@BankName", (object?)kitchen.BankName ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@AccountNumber", (object?)kitchen.AccountNumber ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IfscCode", (object?)kitchen.IfscCode ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@UtrNumber", (object?)kitchen.UtrNumber ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@PaymentScreenshot", (object?)kitchen.PaymentScreenshot ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IsLive", kitchen.IsLive);

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
                LogoUrl = r.IsDBNull(r.GetOrdinal("logo_url")) ? null : r.GetString(r.GetOrdinal("logo_url")),
                Address = r.IsDBNull(r.GetOrdinal("address")) ? null : r.GetString(r.GetOrdinal("address")),
                Floor = r.IsDBNull(r.GetOrdinal("floor")) ? null : r.GetString(r.GetOrdinal("floor")),
                OfficeGaliNumber = r.IsDBNull(r.GetOrdinal("office_gali_number")) ? null : r.GetString(r.GetOrdinal("office_gali_number")),
                Latitude = r.IsDBNull(r.GetOrdinal("latitude")) ? null : r.GetDecimal(r.GetOrdinal("latitude")),
                Longitude = r.IsDBNull(r.GetOrdinal("longitude")) ? null : r.GetDecimal(r.GetOrdinal("longitude")),
                IsApproved = r.IsDBNull(r.GetOrdinal("is_approved")) ? "pending" : r.GetString(r.GetOrdinal("is_approved")),
                OwnerName = r.IsDBNull(r.GetOrdinal("owner_name")) ? "Housewife Partner" : r.GetString(r.GetOrdinal("owner_name")),
                BankAccount = r.IsDBNull(r.GetOrdinal("bank_account")) ? "" : r.GetString(r.GetOrdinal("bank_account")),
                CoverImageUrl = r.IsDBNull(r.GetOrdinal("cover_image_url")) ? null : r.GetString(r.GetOrdinal("cover_image_url")),
                BankName = r.IsDBNull(r.GetOrdinal("bank_name")) ? null : r.GetString(r.GetOrdinal("bank_name")),
                AccountNumber = r.IsDBNull(r.GetOrdinal("account_number")) ? null : r.GetString(r.GetOrdinal("account_number")),
                IfscCode = r.IsDBNull(r.GetOrdinal("ifsc_code")) ? null : r.GetString(r.GetOrdinal("ifsc_code")),
                OwnerPhone = r.IsDBNull(r.GetOrdinal("owner_phone")) ? null : r.GetString(r.GetOrdinal("owner_phone")),
                CreatedAt = r.GetDateTime(r.GetOrdinal("created_at")),
                UtrNumber = r.IsDBNull(r.GetOrdinal("utr_number")) ? null : r.GetString(r.GetOrdinal("utr_number")),
                PaymentScreenshot = r.IsDBNull(r.GetOrdinal("payment_screenshot")) ? null : r.GetString(r.GetOrdinal("payment_screenshot")),
                IsLive = r.IsDBNull(r.GetOrdinal("is_live")) ? true : r.GetBoolean(r.GetOrdinal("is_live"))
            };
        }

        public async Task<List<string>> GetSuperAdminIdsAsync()
        {
            var list = new List<string>();
            try
            {
                using var conn = GetConnection();
                await conn.OpenAsync();
                using var cmd = new NpgsqlCommand("SELECT id FROM user_register WHERE role = 'superadmin';", conn);
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    list.Add(reader.GetString(0));
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving superadmins: {ex.Message}");
            }

            if (list.Count == 0)
            {
                list.Add("superadmin");
            }
            return list;
        }

        public async Task<bool> InsertNotificationAsync(string userId, string title, string body)
        {
            try
            {
                using var conn = GetConnection();
                await conn.OpenAsync();
                using var cmd = new NpgsqlCommand(Sql.InsertNotification, conn);
                cmd.Parameters.AddWithValue("@Id", Guid.NewGuid().ToString("N"));
                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@Title", title);
                cmd.Parameters.AddWithValue("@Body", body);
                var result = await cmd.ExecuteNonQueryAsync();
                return result > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error inserting notification: {ex.Message}");
                return false;
            }
        }
    }
}
