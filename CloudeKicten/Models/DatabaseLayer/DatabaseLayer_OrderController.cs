using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace CloudeKicten.Models.DatabaseLayer
{
    public interface IDatabaseLayer_OrderController
    {
        Task<List<OrderDb>> GetAllOrdersAsync();
        Task<List<OrderDb>> GetOrdersByCustomerIdAsync(string customerId);
        Task<List<OrderDb>> GetOrdersByKitchenIdAsync(string kitchenId);
        Task<List<OrderDb>> GetOrdersByRiderIdAsync(string riderId);
        Task<OrderDb?> GetOrderByIdAsync(string id);
        Task<bool> InsertOrderAsync(OrderDb order);
        Task<bool> UpdateOrderStatusAsync(string id, string status);
        Task<bool> DeleteOrderAsync(string id);
        Task<List<ChatDto>> GetChatsByOrderIdAsync(string orderId);
        Task<bool> InsertChatAsync(ChatDb chat);
        Task<bool> AssignRiderToOrderAsync(string id, string riderId);
        Task<List<string>> GetRiderIdsAsync();
        Task<bool> InsertNotificationAsync(string userId, string title, string body);
    }

    public class DatabaseLayer_OrderController : IDatabaseLayer_OrderController
    {
        private readonly IConfiguration _configuration;
        private readonly string DbConnection;

        public DatabaseLayer_OrderController(IConfiguration configuration)
        {
            this._configuration = configuration;
            this.DbConnection = this._configuration.GetConnectionString("AppDbContext") 
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found.");
        }

        private NpgsqlConnection GetConnection() => new NpgsqlConnection(DbConnection);

        public async Task<List<OrderDb>> GetAllOrdersAsync()
        {
            var list = new List<OrderDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetAllOrders, conn);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(MapOrder(reader));
            }
            return list;
        }

        public async Task<List<OrderDb>> GetOrdersByCustomerIdAsync(string customerId)
        {
            var list = new List<OrderDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetOrdersByCustomerId, conn);
            cmd.Parameters.AddWithValue("@CustomerId", customerId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(MapOrder(reader));
            }
            return list;
        }

        public async Task<List<OrderDb>> GetOrdersByKitchenIdAsync(string kitchenId)
        {
            var list = new List<OrderDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetOrdersByKitchenId, conn);
            cmd.Parameters.AddWithValue("@KitchenId", kitchenId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(MapOrder(reader));
            }
            return list;
        }

        public async Task<List<OrderDb>> GetOrdersByRiderIdAsync(string riderId)
        {
            var list = new List<OrderDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetOrdersByRiderId, conn);
            cmd.Parameters.AddWithValue("@RiderId", riderId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(MapOrder(reader));
            }
            return list;
        }

        public async Task<OrderDb?> GetOrderByIdAsync(string id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetOrderById, conn);
            cmd.Parameters.AddWithValue("@Id", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapOrder(reader);
            }
            return null;
        }

        public async Task<bool> InsertOrderAsync(OrderDb order)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.InsertOrder, conn);
            cmd.Parameters.AddWithValue("@Id", order.Id);
            cmd.Parameters.AddWithValue("@KitchenId", order.KitchenId);
            cmd.Parameters.AddWithValue("@CustomerId", order.CustomerId);
            cmd.Parameters.AddWithValue("@ItemsJson", order.ItemsJson);
            cmd.Parameters.AddWithValue("@Subtotal", order.Subtotal);
            cmd.Parameters.AddWithValue("@DeliveryCharge", order.DeliveryCharge);
            cmd.Parameters.AddWithValue("@Tax", order.Tax);
            cmd.Parameters.AddWithValue("@Discount", order.Discount);
            cmd.Parameters.AddWithValue("@Total", order.Total);
            cmd.Parameters.AddWithValue("@Status", order.Status);
            cmd.Parameters.AddWithValue("@PaymentMethod", order.PaymentMethod);
            cmd.Parameters.AddWithValue("@OrderDate", order.OrderDate);
            cmd.Parameters.AddWithValue("@RiderId", (object?)order.RiderId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DeliveryAddress", (object?)order.DeliveryAddress ?? DBNull.Value);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> UpdateOrderStatusAsync(string id, string status)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.UpdateOrderStatus, conn);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@Status", status);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> DeleteOrderAsync(string id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.DeleteOrder, conn);
            cmd.Parameters.AddWithValue("@Id", id);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> AssignRiderToOrderAsync(string id, string riderId)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.AssignRiderToOrder, conn);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@RiderId", riderId);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<List<string>> GetRiderIdsAsync()
        {
            var list = new List<string>();
            try
            {
                using var conn = GetConnection();
                await conn.OpenAsync();
                using var cmd = new NpgsqlCommand("SELECT id FROM user_register WHERE role = 'delivery_boy' OR role = 'rider';", conn);
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    list.Add(reader.GetString(0));
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving rider IDs: {ex.Message}");
            }
            return list;
        }

        public async Task<bool> InsertNotificationAsync(string userId, string title, string body)
        {
            try
            {
                using var conn = GetConnection();
                await conn.OpenAsync();
                using var cmd = new NpgsqlCommand("INSERT INTO notifications (id, user_id, title, body, is_read, created_at) VALUES (@Id, @UserId, @Title, @Body, FALSE, CURRENT_TIMESTAMP);", conn);
                cmd.Parameters.AddWithValue("@Id", "NT-" + new Random().Next(1000, 9999));
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

        public async Task<List<ChatDto>> GetChatsByOrderIdAsync(string orderId)
        {
            var list = new List<ChatDto>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetChatsByOrderId, conn);
            cmd.Parameters.AddWithValue("@OrderId", orderId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new ChatDto
                {
                    Id = reader.GetString(reader.GetOrdinal("id")),
                    OrderId = reader.GetString(reader.GetOrdinal("order_id")),
                    SenderId = reader.GetString(reader.GetOrdinal("sender_id")),
                    SenderName = reader.IsDBNull(reader.GetOrdinal("sender_name")) ? "Unknown" : reader.GetString(reader.GetOrdinal("sender_name")),
                    Message = reader.GetString(reader.GetOrdinal("message")),
                    CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at")).ToString("yyyy-MM-dd HH:mm:ss")
                });
            }
            return list;
        }

        public async Task<bool> InsertChatAsync(ChatDb chat)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.InsertChat, conn);
            cmd.Parameters.AddWithValue("@Id", chat.Id);
            cmd.Parameters.AddWithValue("@OrderId", chat.OrderId);
            cmd.Parameters.AddWithValue("@SenderId", chat.SenderId);
            cmd.Parameters.AddWithValue("@Message", chat.Message);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        private static OrderDb MapOrder(NpgsqlDataReader r)
        {
            return new OrderDb
            {
                Id = r.GetString(r.GetOrdinal("id")),
                KitchenId = r.GetString(r.GetOrdinal("kitchen_id")),
                CustomerId = r.GetString(r.GetOrdinal("customer_id")),
                ItemsJson = r.GetString(r.GetOrdinal("items_json")),
                Subtotal = r.GetDecimal(r.GetOrdinal("subtotal")),
                DeliveryCharge = r.GetDecimal(r.GetOrdinal("delivery_charge")),
                Tax = r.GetDecimal(r.GetOrdinal("tax")),
                Discount = r.GetDecimal(r.GetOrdinal("discount")),
                Total = r.GetDecimal(r.GetOrdinal("total")),
                Status = r.GetString(r.GetOrdinal("status")),
                PaymentMethod = r.GetString(r.GetOrdinal("payment_method")),
                OrderDate = r.GetString(r.GetOrdinal("order_date")),
                RiderId = r.IsDBNull(r.GetOrdinal("rider_id")) ? null : r.GetString(r.GetOrdinal("rider_id")),
                DeliveryAddress = r.IsDBNull(r.GetOrdinal("delivery_address")) ? null : r.GetString(r.GetOrdinal("delivery_address")),
                CreatedAt = r.GetDateTime(r.GetOrdinal("created_at"))
            };
        }
    }
}
