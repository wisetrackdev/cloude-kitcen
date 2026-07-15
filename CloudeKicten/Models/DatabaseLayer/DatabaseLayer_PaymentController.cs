using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace CloudeKicten.Models.DatabaseLayer
{
    public interface IDatabaseLayer_PaymentController
    {
        Task<bool> IsUtrExistsAsync(string utr);
        Task<bool> IsTransactionIdExistsAsync(string transactionId);
        Task<bool> InsertOrderWithPaymentAsync(OrderDb order, PaymentDb payment);
        Task EnsurePaymentColumnsExistAsync();
    }

    public class DatabaseLayer_PaymentController : IDatabaseLayer_PaymentController
    {
        private readonly IConfiguration _configuration;
        private readonly string _dbConnection;

        public DatabaseLayer_PaymentController(IConfiguration configuration)
        {
            _configuration = configuration;
            _dbConnection = _configuration.GetConnectionString("AppDbContext") 
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found.");
        }

        private NpgsqlConnection GetConnection() => new NpgsqlConnection(_dbConnection);

        public async Task<bool> IsUtrExistsAsync(string utr)
        {
            if (string.IsNullOrWhiteSpace(utr)) return false;

            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("SELECT COUNT(1) FROM payments WHERE utr = @Utr OR transaction_id = @Utr;", conn);
            cmd.Parameters.AddWithValue("@Utr", utr.Trim());
            
            var count = (long?)await cmd.ExecuteScalarAsync() ?? 0;
            return count > 0;
        }

        public async Task<bool> IsTransactionIdExistsAsync(string transactionId)
        {
            if (string.IsNullOrWhiteSpace(transactionId)) return false;

            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("SELECT COUNT(1) FROM payments WHERE transaction_id = @TxId OR utr = @TxId;", conn);
            cmd.Parameters.AddWithValue("@TxId", transactionId.Trim());
            
            var count = (long?)await cmd.ExecuteScalarAsync() ?? 0;
            return count > 0;
        }

        public async Task<bool> InsertOrderWithPaymentAsync(OrderDb order, PaymentDb payment)
        {
            // Execute the order creation and payment log in a single transaction to ensure atomicity.
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var transaction = await conn.BeginTransactionAsync();

            try
            {
                // 1. Insert Order
                using var cmdOrder = new NpgsqlCommand(Sql.InsertOrder, conn, transaction);
                cmdOrder.Parameters.AddWithValue("@Id", order.Id);
                cmdOrder.Parameters.AddWithValue("@KitchenId", order.KitchenId);
                cmdOrder.Parameters.AddWithValue("@CustomerId", order.CustomerId);
                cmdOrder.Parameters.AddWithValue("@ItemsJson", order.ItemsJson);
                cmdOrder.Parameters.AddWithValue("@Subtotal", order.Subtotal);
                cmdOrder.Parameters.AddWithValue("@DeliveryCharge", order.DeliveryCharge);
                cmdOrder.Parameters.AddWithValue("@Tax", order.Tax);
                cmdOrder.Parameters.AddWithValue("@Discount", order.Discount);
                cmdOrder.Parameters.AddWithValue("@Total", order.Total);
                cmdOrder.Parameters.AddWithValue("@Status", order.Status);
                cmdOrder.Parameters.AddWithValue("@PaymentMethod", order.PaymentMethod);
                cmdOrder.Parameters.AddWithValue("@OrderDate", order.OrderDate);
                cmdOrder.Parameters.AddWithValue("@RiderId", DBNull.Value);
                cmdOrder.Parameters.AddWithValue("@DeliveryAddress", (object?)order.DeliveryAddress ?? DBNull.Value);
                cmdOrder.Parameters.AddWithValue("@IsRiderSettled", false);
                cmdOrder.Parameters.AddWithValue("@IsSellerSettled", false);
                cmdOrder.Parameters.AddWithValue("@Latitude", (object?)order.Latitude ?? DBNull.Value);
                cmdOrder.Parameters.AddWithValue("@Longitude", (object?)order.Longitude ?? DBNull.Value);
                
                await cmdOrder.ExecuteNonQueryAsync();

                // 2. Insert Payment
                string insertPaymentSql = @"
                    INSERT INTO payments (id, order_id, amount, payment_method, transaction_id, utr, status, created_at)
                    VALUES (@Id, @OrderId, @Amount, @PaymentMethod, @TransactionId, @Utr, @Status, @CreatedAt);";
                
                using var cmdPay = new NpgsqlCommand(insertPaymentSql, conn, transaction);
                cmdPay.Parameters.AddWithValue("@Id", payment.Id);
                cmdPay.Parameters.AddWithValue("@OrderId", payment.OrderId ?? (object)DBNull.Value);
                cmdPay.Parameters.AddWithValue("@Amount", payment.Amount);
                cmdPay.Parameters.AddWithValue("@PaymentMethod", payment.PaymentMethod);
                cmdPay.Parameters.AddWithValue("@TransactionId", payment.TransactionId);
                cmdPay.Parameters.AddWithValue("@Utr", payment.Utr);
                cmdPay.Parameters.AddWithValue("@Status", payment.Status);
                cmdPay.Parameters.AddWithValue("@CreatedAt", payment.CreatedAt);

                await cmdPay.ExecuteNonQueryAsync();

                // 3. Update Kitchen stats (Revenue & orders count)
                using var cmdStats = new NpgsqlCommand(Sql.UpdateKitchenStats, conn, transaction);
                cmdStats.Parameters.AddWithValue("@Id", order.KitchenId);
                cmdStats.Parameters.AddWithValue("@TotalAmount", order.Total);
                await cmdStats.ExecuteNonQueryAsync();

                // 4. Update payment_status column in orders
                using var cmdUpdateOrderPay = new NpgsqlCommand("UPDATE orders SET payment_status = 'Paid' WHERE id = @OrderId;", conn, transaction);
                cmdUpdateOrderPay.Parameters.AddWithValue("@OrderId", order.Id);
                await cmdUpdateOrderPay.ExecuteNonQueryAsync();

                await transaction.CommitAsync();
                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task EnsurePaymentColumnsExistAsync()
        {
            try
            {
                using var conn = GetConnection();
                await conn.OpenAsync();
                using var cmd = conn.CreateCommand();
                
                // Add utr to payments table if it does not exist
                cmd.CommandText = "ALTER TABLE payments ADD COLUMN IF NOT EXISTS utr VARCHAR(150) NULL;";
                await cmd.ExecuteNonQueryAsync();

                // Add payment_status to orders table if it does not exist
                cmd.CommandText = "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';";
                await cmd.ExecuteNonQueryAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DB MIGRATION WARNING] Failed to ensure payment columns exist: {ex.Message}");
            }
        }
    }
}
