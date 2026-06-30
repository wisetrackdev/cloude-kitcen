using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace CloudeKicten.Models.DatabaseLayer
{
    public interface IDatabaseLayer_CouponController
    {
        Task<List<CouponDb>> GetAllActiveCouponsAsync();
        Task<CouponDb?> GetCouponByCodeAsync(string code);
        Task<bool> InsertCouponAsync(CouponDb coupon);
    }

    public class DatabaseLayer_CouponController : IDatabaseLayer_CouponController
    {
        private readonly IConfiguration _configuration;
        private readonly string DbConnection;

        public DatabaseLayer_CouponController(IConfiguration configuration)
        {
            this._configuration = configuration;
            this.DbConnection = this._configuration.GetConnectionString("AppDbContext") 
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found.");
        }

        private NpgsqlConnection GetConnection() => new NpgsqlConnection(DbConnection);

        public async Task<List<CouponDb>> GetAllActiveCouponsAsync()
        {
            var list = new List<CouponDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetAllCoupons, conn);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(MapCoupon(reader));
            }
            return list;
        }

        public async Task<CouponDb?> GetCouponByCodeAsync(string code)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetCouponByCode, conn);
            cmd.Parameters.AddWithValue("@Code", code.Trim().ToUpper());

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapCoupon(reader);
            }
            return null;
        }

        public async Task<bool> InsertCouponAsync(CouponDb c)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.InsertCoupon, conn);
            cmd.Parameters.AddWithValue("@Id", c.Id);
            cmd.Parameters.AddWithValue("@Code", c.Code.Trim().ToUpper());
            cmd.Parameters.AddWithValue("@DiscountType", c.DiscountType);
            cmd.Parameters.AddWithValue("@DiscountValue", c.DiscountValue);
            cmd.Parameters.AddWithValue("@MaxDiscount", c.MaxDiscount);
            cmd.Parameters.AddWithValue("@MinOrder", c.MinOrder);
            cmd.Parameters.AddWithValue("@ExpiryDate", c.ExpiryDate);
            cmd.Parameters.AddWithValue("@IsActive", c.IsActive);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        private static CouponDb MapCoupon(NpgsqlDataReader r)
        {
            return new CouponDb
            {
                Id = r.GetString(r.GetOrdinal("Id")),
                Code = r.GetString(r.GetOrdinal("Code")),
                DiscountType = r.GetString(r.GetOrdinal("DiscountType")),
                DiscountValue = r.GetDecimal(r.GetOrdinal("DiscountValue")),
                MaxDiscount = r.GetDecimal(r.GetOrdinal("MaxDiscount")),
                MinOrder = r.GetDecimal(r.GetOrdinal("MinOrder")),
                ExpiryDate = r.GetDateTime(r.GetOrdinal("ExpiryDate")),
                IsActive = r.GetBoolean(r.GetOrdinal("IsActive")),
                CreatedAt = r.GetDateTime(r.GetOrdinal("CreatedAt"))
            };
        }
    }

    public class CouponDb
    {
        public string Id { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string DiscountType { get; set; } = "percentage"; // percentage, fixed
        public decimal DiscountValue { get; set; }
        public decimal MaxDiscount { get; set; }
        public decimal MinOrder { get; set; }
        public DateTime ExpiryDate { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
