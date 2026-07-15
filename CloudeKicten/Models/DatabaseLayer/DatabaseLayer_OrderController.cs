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
        Task<bool> UpdateOrderStatusAsync(string id, string status, string? pickupPhotoUrl = null, string? deliveryPhotoUrl = null);
        Task<bool> DeleteOrderAsync(string id);
        Task<List<ChatDto>> GetChatsByOrderIdAsync(string orderId);
        Task<bool> InsertChatAsync(ChatDb chat);
        Task<bool> AssignRiderToOrderAsync(string id, string riderId);
        Task<List<string>> GetRiderIdsAsync();
        Task<bool> InsertNotificationAsync(string userId, string title, string body);
        Task<List<SupportRoomDto>> GetSupportRoomsAsync();
        Task<List<AddressDb>> GetAddressesByUserIdAsync(string userId);
        Task<AddressDb?> GetAddressByIdAsync(string id);
        Task<bool> InsertAddressAsync(AddressDb address);
        Task<bool> DeleteAddressAsync(string id);
        Task<List<RiderLocationDto>> GetOnlineRidersAsync();
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
            cmd.Parameters.AddWithValue("@IsRiderSettled", order.IsRiderSettled);
            cmd.Parameters.AddWithValue("@IsSellerSettled", order.IsSellerSettled);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> UpdateOrderStatusAsync(string id, string status, string? pickupPhotoUrl = null, string? deliveryPhotoUrl = null)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.UpdateOrderStatus, conn);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@Status", status);
            cmd.Parameters.AddWithValue("@PickupPhotoUrl", (object?)pickupPhotoUrl ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DeliveryPhotoUrl", (object?)deliveryPhotoUrl ?? DBNull.Value);

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
                CreatedAt = r.GetDateTime(r.GetOrdinal("created_at")),
                PickedUpAt = r.IsDBNull(r.GetOrdinal("picked_up_at")) ? null : r.GetDateTime(r.GetOrdinal("picked_up_at")),
                DeliveredAt = r.IsDBNull(r.GetOrdinal("delivered_at")) ? null : r.GetDateTime(r.GetOrdinal("delivered_at")),
                AcceptedByRiderAt = r.IsDBNull(r.GetOrdinal("accepted_by_rider_at")) ? null : r.GetDateTime(r.GetOrdinal("accepted_by_rider_at")),
                PickupPhotoUrl = r.IsDBNull(r.GetOrdinal("pickup_photo_url")) ? null : r.GetString(r.GetOrdinal("pickup_photo_url")),
                DeliveryPhotoUrl = r.IsDBNull(r.GetOrdinal("delivery_photo_url")) ? null : r.GetString(r.GetOrdinal("delivery_photo_url")),
                IsRiderSettled = r.IsDBNull(r.GetOrdinal("is_rider_settled")) ? false : r.GetBoolean(r.GetOrdinal("is_rider_settled")),
                IsSellerSettled = r.IsDBNull(r.GetOrdinal("is_seller_settled")) ? false : r.GetBoolean(r.GetOrdinal("is_seller_settled"))
            };
        }

        public async Task<List<SupportRoomDto>> GetSupportRoomsAsync()
        {
            var list = new List<SupportRoomDto>();
            try
            {
                using var conn = GetConnection();
                await conn.OpenAsync();
                string sql = @"
                    SELECT DISTINCT c.order_id, 
                           COALESCE(u.id, k.owner) AS customer_id, 
                           COALESCE(CONCAT(u.first_name, ' ', u.last_name), k.name) AS customer_name
                    FROM order_chats c
                    LEFT JOIN user_register u ON c.order_id = CONCAT('support-', u.id)
                    LEFT JOIN kitchens k ON c.order_id = CONCAT('support-seller-', k.id)
                    WHERE c.order_id LIKE 'support-%'
                    ORDER BY c.order_id DESC;
                ";
                using var cmd = new NpgsqlCommand(sql, conn);
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    list.Add(new SupportRoomDto
                    {
                        OrderId = reader.GetString(0),
                        CustomerId = reader.GetString(1),
                        CustomerName = reader.GetString(2)
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching support rooms: {ex.Message}");
            }
            return list;
        }

        public async Task<List<AddressDb>> GetAddressesByUserIdAsync(string userId)
        {
            var list = new List<AddressDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("SELECT id, user_id, address_name, address_line, latitude, longitude, is_default, created_at FROM addresses WHERE user_id = @UserId ORDER BY created_at DESC;", conn);
            cmd.Parameters.AddWithValue("@UserId", userId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new AddressDb
                {
                    Id = reader.GetString(0),
                    UserId = reader.GetString(1),
                    AddressName = reader.GetString(2),
                    AddressLine = reader.GetString(3),
                    Latitude = reader.IsDBNull(4) ? null : reader.GetDecimal(4),
                    Longitude = reader.IsDBNull(5) ? null : reader.GetDecimal(5),
                    IsDefault = reader.GetBoolean(6),
                    CreatedAt = reader.GetDateTime(7)
                });
            }
            return list;
        }

        public async Task<AddressDb?> GetAddressByIdAsync(string id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("SELECT id, user_id, address_name, address_line, latitude, longitude, is_default, created_at FROM addresses WHERE id = @Id;", conn);
            cmd.Parameters.AddWithValue("@Id", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new AddressDb
                {
                    Id = reader.GetString(0),
                    UserId = reader.GetString(1),
                    AddressName = reader.GetString(2),
                    AddressLine = reader.GetString(3),
                    Latitude = reader.IsDBNull(4) ? null : reader.GetDecimal(4),
                    Longitude = reader.IsDBNull(5) ? null : reader.GetDecimal(5),
                    IsDefault = reader.GetBoolean(6),
                    CreatedAt = reader.GetDateTime(7)
                };
            }
            return null;
        }

        public async Task<bool> InsertAddressAsync(AddressDb address)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();

            if (address.IsDefault)
            {
                using var clearCmd = new NpgsqlCommand("UPDATE addresses SET is_default = FALSE WHERE user_id = @UserId;", conn);
                clearCmd.Parameters.AddWithValue("@UserId", address.UserId);
                await clearCmd.ExecuteNonQueryAsync();
            }

            using var cmd = new NpgsqlCommand("INSERT INTO addresses (id, user_id, address_name, address_line, latitude, longitude, is_default, created_at) VALUES (@Id, @UserId, @AddressName, @AddressLine, @Latitude, @Longitude, @IsDefault, @CreatedAt);", conn);
            cmd.Parameters.AddWithValue("@Id", address.Id);
            cmd.Parameters.AddWithValue("@UserId", address.UserId);
            cmd.Parameters.AddWithValue("@AddressName", address.AddressName);
            cmd.Parameters.AddWithValue("@AddressLine", address.AddressLine);
            cmd.Parameters.AddWithValue("@Latitude", (object?)address.Latitude ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Longitude", (object?)address.Longitude ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IsDefault", address.IsDefault);
            cmd.Parameters.AddWithValue("@CreatedAt", address.CreatedAt);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> DeleteAddressAsync(string id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("DELETE FROM addresses WHERE id = @Id;", conn);
            cmd.Parameters.AddWithValue("@Id", id);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<List<RiderLocationDto>> GetOnlineRidersAsync()
        {
            var list = new List<RiderLocationDto>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand("SELECT id, current_latitude, current_longitude FROM delivery_partners WHERE is_active = true AND is_approved = true AND current_latitude IS NOT NULL AND current_longitude IS NOT NULL;", conn);
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new RiderLocationDto
                {
                    RiderId = reader.GetString(0),
                    Latitude = reader.GetDecimal(1),
                    Longitude = reader.GetDecimal(2)
                });
            }
            return list;
        }
    }
}
