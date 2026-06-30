using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace CloudeKicten.Models.DatabaseLayer
{
    public interface IDatabaseLayer_WalletController
    {
        Task<WalletDb?> GetWalletByUserIdAsync(string userId);
        Task<bool> EnsureWalletExistsAsync(string userId);
        Task<bool> UpdateWalletBalanceAsync(string userId, decimal amount, string type, string description);
        Task<List<WalletTransactionDb>> GetWalletTransactionsAsync(string userId);
        Task<bool> InsertPaymentAsync(string id, string? orderId, string? subId, decimal amount, string method, string txId, string status);
    }

    public class DatabaseLayer_WalletController : IDatabaseLayer_WalletController
    {
        private readonly IConfiguration _configuration;
        private readonly string DbConnection;

        public DatabaseLayer_WalletController(IConfiguration configuration)
        {
            this._configuration = configuration;
            this.DbConnection = this._configuration.GetConnectionString("AppDbContext") 
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found.");
        }

        private NpgsqlConnection GetConnection() => new NpgsqlConnection(DbConnection);

        public async Task<WalletDb?> GetWalletByUserIdAsync(string userId)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetWalletByUserId, conn);
            cmd.Parameters.AddWithValue("@Id", userId);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new WalletDb
                {
                    Id = reader.GetString(reader.GetOrdinal("id")),
                    Balance = reader.GetDecimal(reader.GetOrdinal("balance")),
                    UpdatedAt = reader.GetDateTime(reader.GetOrdinal("updated_at"))
                };
            }
            return null;
        }

        public async Task<bool> EnsureWalletExistsAsync(string userId)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.InsertWallet, conn);
            cmd.Parameters.AddWithValue("@Id", userId);
            cmd.Parameters.AddWithValue("@Balance", 0.00m);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> UpdateWalletBalanceAsync(string userId, decimal amount, string type, string description)
        {
            await EnsureWalletExistsAsync(userId);

            using var conn = GetConnection();
            await conn.OpenAsync();
            using var tx = await conn.BeginTransactionAsync();

            try
            {
                using var cmdUpdate = new NpgsqlCommand(Sql.UpdateWalletBalance, conn, tx);
                cmdUpdate.Parameters.AddWithValue("@Id", userId);
                cmdUpdate.Parameters.AddWithValue("@Amount", amount);
                await cmdUpdate.ExecuteNonQueryAsync();

                decimal finalAmount = type.Equals("credit", StringComparison.OrdinalIgnoreCase) ? amount : -amount;

                using var cmdLog = new NpgsqlCommand(Sql.InsertWalletTransaction, conn, tx);
                cmdLog.Parameters.AddWithValue("@Id", Guid.NewGuid().ToString("N"));
                cmdLog.Parameters.AddWithValue("@WalletId", userId);
                cmdLog.Parameters.AddWithValue("@Amount", finalAmount);
                cmdLog.Parameters.AddWithValue("@Type", type.ToLower());
                cmdLog.Parameters.AddWithValue("@Description", description);
                await cmdLog.ExecuteNonQueryAsync();

                await tx.CommitAsync();
                return true;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task<List<WalletTransactionDb>> GetWalletTransactionsAsync(string userId)
        {
            var list = new List<WalletTransactionDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetWalletTransactions, conn);
            cmd.Parameters.AddWithValue("@WalletId", userId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new WalletTransactionDb
                {
                    Id = reader.GetString(reader.GetOrdinal("id")),
                    WalletId = reader.GetString(reader.GetOrdinal("wallet_id")),
                    Amount = reader.GetDecimal(reader.GetOrdinal("amount")),
                    Type = reader.GetString(reader.GetOrdinal("type")),
                    Description = reader.GetString(reader.GetOrdinal("description")),
                    CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at"))
                });
            }
            return list;
        }

        public async Task<bool> InsertPaymentAsync(string id, string? orderId, string? subId, decimal amount, string method, string txId, string status)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            
            string insertPaymentSql = @"
                INSERT INTO payments (id, order_id, subscription_id, amount, payment_method, transaction_id, status, created_at)
                VALUES (@Id, @OrderId, @SubscriptionId, @Amount, @PaymentMethod, @TransactionId, @Status, CURRENT_TIMESTAMP);";

            using var cmdInsert = new NpgsqlCommand(insertPaymentSql, conn);
            cmdInsert.Parameters.AddWithValue("@Id", id);
            cmdInsert.Parameters.AddWithValue("@OrderId", (object?)orderId ?? DBNull.Value);
            cmdInsert.Parameters.AddWithValue("@SubscriptionId", (object?)subId ?? DBNull.Value);
            cmdInsert.Parameters.AddWithValue("@Amount", amount);
            cmdInsert.Parameters.AddWithValue("@PaymentMethod", method);
            cmdInsert.Parameters.AddWithValue("@TransactionId", txId);
            cmdInsert.Parameters.AddWithValue("@Status", status);

            var result = await cmdInsert.ExecuteNonQueryAsync();
            return result > 0;
        }
    }

    public class WalletDb
    {
        public string Id { get; set; } = string.Empty;
        public decimal Balance { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class WalletTransactionDb
    {
        public string Id { get; set; } = string.Empty;
        public string WalletId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Type { get; set; } = "credit";
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
