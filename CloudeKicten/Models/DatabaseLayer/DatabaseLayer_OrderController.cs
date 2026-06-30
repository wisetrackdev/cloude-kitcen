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
        Task<OrderDb?> GetOrderByIdAsync(string id);
        Task<bool> InsertOrderAsync(OrderDb order);
        Task<bool> UpdateOrderStatusAsync(string id, string status);
        Task<bool> DeleteOrderAsync(string id);
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
                CreatedAt = r.GetDateTime(r.GetOrdinal("created_at"))
            };
        }
    }
}
