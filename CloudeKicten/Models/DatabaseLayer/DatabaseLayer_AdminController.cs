using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace CloudeKicten.Models.DatabaseLayer
{
    public interface IDatabaseLayer_AdminController
    {
        Task<AdminStatsDto> GetDashboardStatsAsync();
        Task<List<VendorDb>> GetPendingVendorsAsync();
        Task<bool> ApproveVendorAsync(string id, string status);
        Task<bool> ApproveRiderAsync(string id, bool isApproved);
        Task<List<SettlementDb>> GetAllSettlementsAsync();
        Task<bool> CreateSettlementAsync(SettlementDb settlement);
        Task<bool> UpdateSettlementStatusAsync(string id, string status, string txDetails);
        Task<List<BannerDb>> GetActiveBannersAsync();
        Task<bool> InsertBannerAsync(BannerDb banner);
        Task<bool> WriteAuditLogAsync(string userId, string action, string details);
    }

    public class DatabaseLayer_AdminController : IDatabaseLayer_AdminController
    {
        private readonly IConfiguration _configuration;
        private readonly string DbConnection;

        public DatabaseLayer_AdminController(IConfiguration configuration)
        {
            this._configuration = configuration;
            this.DbConnection = this._configuration.GetConnectionString("AppDbContext") 
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found.");
        }

        private NpgsqlConnection GetConnection() => new NpgsqlConnection(DbConnection);

        public async Task<AdminStatsDto> GetDashboardStatsAsync()
        {
            var stats = new AdminStatsDto();
            using var conn = GetConnection();
            await conn.OpenAsync();

            using var cmd1 = new NpgsqlCommand("SELECT COUNT(*) FROM user_register WHERE role = 'customer';", conn);
            stats.TotalCustomers = Convert.ToInt32(await cmd1.ExecuteScalarAsync());

            using var cmd2 = new NpgsqlCommand("SELECT COUNT(*) FROM shops;", conn);
            stats.TotalKitchens = Convert.ToInt32(await cmd2.ExecuteScalarAsync());

            using var cmd3 = new NpgsqlCommand("SELECT COUNT(*) FROM user_register WHERE role = 'rider';", conn);
            stats.TotalRiders = Convert.ToInt32(await cmd3.ExecuteScalarAsync());

            using var cmd4 = new NpgsqlCommand("SELECT COUNT(*) FROM orders;", conn);
            stats.TotalOrders = Convert.ToInt32(await cmd4.ExecuteScalarAsync());

            using var cmd5 = new NpgsqlCommand("SELECT COALESCE(SUM(total), 0.00) FROM orders WHERE status = 'delivered';", conn);
            stats.TotalRevenue = Convert.ToDecimal(await cmd5.ExecuteScalarAsync());

            return stats;
        }

        public async Task<List<VendorDb>> GetPendingVendorsAsync()
        {
            var list = new List<VendorDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("SELECT id, user_id, business_name, owner_name, cuisines, type, is_approved, commission_rate, created_at FROM vendors WHERE is_approved = 'pending' ORDER BY created_at DESC;", conn);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new VendorDb
                {
                    Id = reader.GetString(reader.GetOrdinal("id")),
                    UserId = reader.GetString(reader.GetOrdinal("user_id")),
                    BusinessName = reader.GetString(reader.GetOrdinal("business_name")),
                    OwnerName = reader.GetString(reader.GetOrdinal("owner_name")),
                    Cuisines = reader.GetString(reader.GetOrdinal("cuisines")),
                    Type = reader.GetString(reader.GetOrdinal("type")),
                    IsApproved = reader.GetString(reader.GetOrdinal("is_approved")),
                    CommissionRate = reader.GetDecimal(reader.GetOrdinal("commission_rate")),
                    CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at"))
                });
            }
            return list;
        }

        public async Task<bool> ApproveVendorAsync(string id, string status)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var tx = await conn.BeginTransactionAsync();

            try
            {
                using var cmd1 = new NpgsqlCommand(Sql.UpdateVendorApproval, conn, tx);
                cmd1.Parameters.AddWithValue("@Id", id);
                cmd1.Parameters.AddWithValue("@IsApproved", status);
                await cmd1.ExecuteNonQueryAsync();

                if (status.Equals("approved", StringComparison.OrdinalIgnoreCase))
                {
                    using var cmd2 = new NpgsqlCommand("UPDATE shops SET is_live = TRUE WHERE vendor_id = @Id;", conn, tx);
                    cmd2.Parameters.AddWithValue("@Id", id);
                    await cmd2.ExecuteNonQueryAsync();
                }

                await tx.CommitAsync();
                return true;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> ApproveRiderAsync(string id, bool isApproved)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.UpdateRiderApproval, conn);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@IsApproved", isApproved);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<List<SettlementDb>> GetAllSettlementsAsync()
        {
            var list = new List<SettlementDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("SELECT id, user_type, user_id, amount, status, transaction_details, settled_at FROM settlements ORDER BY settled_at DESC;", conn);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new SettlementDb
                {
                    Id = reader.GetString(reader.GetOrdinal("id")),
                    UserType = reader.GetString(reader.GetOrdinal("user_type")),
                    UserId = reader.GetString(reader.GetOrdinal("user_id")),
                    Amount = reader.GetDecimal(reader.GetOrdinal("amount")),
                    Status = reader.GetString(reader.GetOrdinal("status")),
                    TransactionDetails = reader.IsDBNull(reader.GetOrdinal("transaction_details")) ? null : reader.GetString(reader.GetOrdinal("transaction_details")),
                    SettledAt = reader.GetDateTime(reader.GetOrdinal("settled_at"))
                });
            }
            return list;
        }

        public async Task<bool> CreateSettlementAsync(SettlementDb s)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("INSERT INTO settlements (id, user_type, user_id, amount, status, transaction_details, settled_at) VALUES (@Id, @UserType, @UserId, @Amount, @Status, @TransactionDetails, CURRENT_TIMESTAMP);", conn);
            cmd.Parameters.AddWithValue("@Id", s.Id);
            cmd.Parameters.AddWithValue("@UserType", s.UserType);
            cmd.Parameters.AddWithValue("@UserId", s.UserId);
            cmd.Parameters.AddWithValue("@Amount", s.Amount);
            cmd.Parameters.AddWithValue("@Status", s.Status);
            cmd.Parameters.AddWithValue("@TransactionDetails", (object?)s.TransactionDetails ?? DBNull.Value);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> UpdateSettlementStatusAsync(string id, string status, string txDetails)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("UPDATE settlements SET status = @Status, transaction_details = @TxDetails, settled_at = CURRENT_TIMESTAMP WHERE id = @Id;", conn);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@Status", status);
            cmd.Parameters.AddWithValue("@TxDetails", txDetails);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<List<BannerDb>> GetActiveBannersAsync()
        {
            var list = new List<BannerDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("SELECT id, image_url, link_url, is_active, created_at FROM banners WHERE is_active = TRUE ORDER BY created_at DESC;", conn);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new BannerDb
                {
                    Id = reader.GetString(reader.GetOrdinal("id")),
                    ImageUrl = reader.GetString(reader.GetOrdinal("image_url")),
                    LinkUrl = reader.IsDBNull(reader.GetOrdinal("link_url")) ? null : reader.GetString(reader.GetOrdinal("link_url")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("is_active")),
                    CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at"))
                });
            }
            return list;
        }

        public async Task<bool> InsertBannerAsync(BannerDb b)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("INSERT INTO banners (id, image_url, link_url, is_active, created_at) VALUES (@Id, @ImageUrl, @LinkUrl, @IsActive, CURRENT_TIMESTAMP);", conn);
            cmd.Parameters.AddWithValue("@Id", b.Id);
            cmd.Parameters.AddWithValue("@ImageUrl", b.ImageUrl);
            cmd.Parameters.AddWithValue("@LinkUrl", (object?)b.LinkUrl ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IsActive", b.IsActive);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> WriteAuditLogAsync(string userId, string action, string details)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.InsertAuditLog, conn);
            cmd.Parameters.AddWithValue("@Id", Guid.NewGuid().ToString("N"));
            cmd.Parameters.AddWithValue("@UserId", (object?)userId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Action", action);
            cmd.Parameters.AddWithValue("@Details", (object?)details ?? DBNull.Value);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }
    }

    public class VendorDb
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string Cuisines { get; set; } = string.Empty;
        public string Type { get; set; } = "home_tiffin";
        public string IsApproved { get; set; } = "pending";
        public decimal CommissionRate { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SettlementDb
    {
        public string Id { get; set; } = string.Empty;
        public string UserType { get; set; } = "vendor";
        public string UserId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = "pending";
        public string? TransactionDetails { get; set; }
        public DateTime SettledAt { get; set; }
    }

    public class BannerDb
    {
        public string Id { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string? LinkUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
    }

    public class AdminStatsDto
    {
        public int TotalCustomers { get; set; }
        public int TotalKitchens { get; set; }
        public int TotalRiders { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
    }
}
