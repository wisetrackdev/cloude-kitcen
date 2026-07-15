using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using CloudeKicten.Models.DatabaseLayer;

namespace CloudeKicten.Models.BusinessLayer
{
    public interface IBusinessLayer_OrderController
    {
        Task<ApiResponse<List<OrderResponseDto>>> GetAllOrdersAsync();
        Task<ApiResponse<List<OrderResponseDto>>> GetOrdersByCustomerIdAsync(string customerId);
        Task<ApiResponse<List<OrderResponseDto>>> GetOrdersByKitchenIdAsync(string kitchenId);
        Task<ApiResponse<List<OrderResponseDto>>> GetOrdersByRiderIdAsync(string riderId);
        Task<ApiResponse<OrderResponseDto>> GetOrderByIdAsync(string id);
        Task<ApiResponse<OrderResponseDto>> CreateOrderAsync(OrderCreateDto dto);
        Task<ApiResponse<OrderResponseDto>> UpdateOrderStatusAsync(string id, string status, string? pickupPhotoUrl = null, string? deliveryPhotoUrl = null);
        Task<ApiResponse<bool>> DeleteOrderAsync(string id);
        Task<ApiResponse<List<ChatDto>>> GetChatsByOrderIdAsync(string orderId);
        Task<ApiResponse<ChatDto>> SendChatMessageAsync(string orderId, ChatCreateDto dto);
        Task<ApiResponse<List<SupportRoomDto>>> GetSupportRoomsAsync();
        Task<ApiResponse<OrderResponseDto>> AcceptOrderAsync(string id, string riderId);
        Task<ApiResponse<List<AddressDto>>> GetAddressesByUserIdAsync(string userId);
        Task<ApiResponse<AddressDto>> SaveAddressAsync(AddressDto dto);
        Task<ApiResponse<bool>> DeleteAddressAsync(string id);
        Task<ApiResponse<DeliveryPreviewResponseDto>> PreviewDeliveryAsync(DeliveryPreviewRequestDto dto);
        Task<ApiResponse<OrderResponseDto>> AssignNearestRiderAsync(string orderId);
    }

    public class BusinessLayer_OrderController : IBusinessLayer_OrderController
    {
        private readonly IDatabaseLayer_OrderController _databaseLayer;
        private readonly IDatabaseLayer_KitchenController _kitchenDatabaseLayer;
        private readonly IDatabaseLayer_AuthController _authDatabaseLayer;
        private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;
        private readonly IDatabaseLayer_WalletController _walletDatabaseLayer;

        public BusinessLayer_OrderController(
            IDatabaseLayer_OrderController databaseLayer,
            IDatabaseLayer_KitchenController kitchenDatabaseLayer,
            IDatabaseLayer_AuthController authDatabaseLayer,
            Microsoft.Extensions.Configuration.IConfiguration configuration,
            IDatabaseLayer_WalletController walletDatabaseLayer)
        {
            this._databaseLayer = databaseLayer;
            this._kitchenDatabaseLayer = kitchenDatabaseLayer;
            this._authDatabaseLayer = authDatabaseLayer;
            this._configuration = configuration;
            this._walletDatabaseLayer = walletDatabaseLayer;
        }

        public async Task<ApiResponse<List<OrderResponseDto>>> GetAllOrdersAsync()
        {
            var dbOrders = await _databaseLayer.GetAllOrdersAsync();
            var list = new List<OrderResponseDto>();
            foreach (var o in dbOrders)
            {
                list.Add(await MapToOrderResponseDtoAsync(o));
            }
            return ApiResponse<List<OrderResponseDto>>.Ok(list);
        }

        public async Task<ApiResponse<List<OrderResponseDto>>> GetOrdersByCustomerIdAsync(string customerId)
        {
            var dbOrders = await _databaseLayer.GetOrdersByCustomerIdAsync(customerId);
            var list = new List<OrderResponseDto>();
            foreach (var o in dbOrders)
            {
                list.Add(await MapToOrderResponseDtoAsync(o));
            }
            return ApiResponse<List<OrderResponseDto>>.Ok(list);
        }

        public async Task<ApiResponse<List<OrderResponseDto>>> GetOrdersByKitchenIdAsync(string kitchenId)
        {
            var dbOrders = await _databaseLayer.GetOrdersByKitchenIdAsync(kitchenId);
            var list = new List<OrderResponseDto>();
            foreach (var o in dbOrders)
            {
                list.Add(await MapToOrderResponseDtoAsync(o));
            }
            return ApiResponse<List<OrderResponseDto>>.Ok(list);
        }

        public async Task<ApiResponse<List<OrderResponseDto>>> GetOrdersByRiderIdAsync(string riderId)
        {
            var dbOrders = await _databaseLayer.GetOrdersByRiderIdAsync(riderId);
            var list = new List<OrderResponseDto>();
            foreach (var o in dbOrders)
            {
                list.Add(await MapToOrderResponseDtoAsync(o));
            }
            return ApiResponse<List<OrderResponseDto>>.Ok(list);
        }

        public async Task<ApiResponse<OrderResponseDto>> GetOrderByIdAsync(string id)
        {
            var o = await _databaseLayer.GetOrderByIdAsync(id);
            if (o == null) return ApiResponse<OrderResponseDto>.Fail("Order not found.");
            var res = await MapToOrderResponseDtoAsync(o);
            return ApiResponse<OrderResponseDto>.Ok(res);
        }

        public async Task<ApiResponse<OrderResponseDto>> CreateOrderAsync(OrderCreateDto dto)
        {
            var customer = await _authDatabaseLayer.GetUserByIdAsync(dto.CustomerId);
            if (customer == null)
                return ApiResponse<OrderResponseDto>.Fail($"Customer with ID '{dto.CustomerId}' not found.");

            var kitchen = await _kitchenDatabaseLayer.GetKitchenByIdAsync(dto.KitchenId);
            if (kitchen == null)
                return ApiResponse<OrderResponseDto>.Fail($"Kitchen with ID '{dto.KitchenId}' not found.");

            double distance = 1.0;
            if (kitchen.Latitude.HasValue && kitchen.Longitude.HasValue && dto.Latitude.HasValue && dto.Longitude.HasValue)
            {
                distance = CalculateHaversineDistance(
                    (double)kitchen.Latitude.Value, (double)kitchen.Longitude.Value,
                    (double)dto.Latitude.Value, (double)dto.Longitude.Value
                );
            }

            decimal calculatedDeliveryCharge = CalculateDeliveryCharge(distance);
            decimal calculatedTotal = dto.Subtotal + calculatedDeliveryCharge + dto.Tax - dto.Discount;

            string orderId = "CK-" + new Random().Next(1000, 9999);
            string orderDate = DateTime.Now.ToString("dd MMMM, h:mm tt") + " today";

            var order = new OrderDb
            {
                Id = orderId,
                KitchenId = dto.KitchenId,
                CustomerId = dto.CustomerId,
                ItemsJson = JsonSerializer.Serialize(dto.Items),
                Subtotal = dto.Subtotal,
                DeliveryCharge = calculatedDeliveryCharge,
                Tax = dto.Tax,
                Discount = dto.Discount,
                Total = calculatedTotal,
                Status = "placed",
                PaymentMethod = dto.PaymentMethod,
                OrderDate = orderDate,
                DeliveryAddress = dto.DeliveryAddress
            };

            await _databaseLayer.InsertOrderAsync(order);

            // Update Kitchen Stats (Revenue & Orders count)
            await _kitchenDatabaseLayer.UpdateKitchenStatsAsync(dto.KitchenId, dto.Total);

            // Credit reward points
            customer.RewardPoints += 10;
            await _authDatabaseLayer.UpdateUserProfileAsync(customer);

            // Create Rider notifications dynamically in DB
            try
            {
                var riders = await _databaseLayer.GetRiderIdsAsync();
                foreach (var rider in riders)
                {
                    await _databaseLayer.InsertNotificationAsync(rider, "New Order Available 🔔", $"A new order is available from {kitchen.Name}. Accept now to pick it up!");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Notification dispatch warning: {ex.Message}");
            }

            var res = await MapToOrderResponseDtoAsync(order);
            return ApiResponse<OrderResponseDto>.Ok(res, "Order placed successfully.");
        }

        public async Task<ApiResponse<OrderResponseDto>> UpdateOrderStatusAsync(string id, string status, string? pickupPhotoUrl = null, string? deliveryPhotoUrl = null)
        {
            var o = await _databaseLayer.GetOrderByIdAsync(id);
            if (o == null) return ApiResponse<OrderResponseDto>.Fail("Order not found.");

            string normalizedStatus = status.Trim().ToLower();

            if (normalizedStatus == "ready")
            {
                return await AssignNearestRiderAsync(id);
            }

            await _databaseLayer.UpdateOrderStatusAsync(id, status, pickupPhotoUrl, deliveryPhotoUrl);
            o.Status = status;
            if (pickupPhotoUrl != null) o.PickupPhotoUrl = pickupPhotoUrl;
            if (deliveryPhotoUrl != null) o.DeliveryPhotoUrl = deliveryPhotoUrl;

            if (normalizedStatus == "delivered" && !string.IsNullOrEmpty(o.RiderId) && !o.IsRiderSettled)
            {
                try
                {
                    await _walletDatabaseLayer.EnsureWalletExistsAsync(o.RiderId);
                    await _walletDatabaseLayer.UpdateWalletBalanceAsync(
                        userId: o.RiderId,
                        amount: o.DeliveryCharge,
                        type: "credit",
                        description: $"Delivery earning for Order {o.Id}"
                    );

                    using (var conn = new Npgsql.NpgsqlConnection(_configuration.GetConnectionString("AppDbContext")))
                    {
                        await conn.OpenAsync();
                        using var cmd = new Npgsql.NpgsqlCommand("UPDATE orders SET is_rider_settled = TRUE WHERE id = @Id;", conn);
                        cmd.Parameters.AddWithValue("@Id", o.Id);
                        await cmd.ExecuteNonQueryAsync();
                    }
                    o.IsRiderSettled = true;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error crediting rider wallet: {ex.Message}");
                }
            }

            var res = await MapToOrderResponseDtoAsync(o);
            return ApiResponse<OrderResponseDto>.Ok(res, "Order status updated successfully.");
        }

        public async Task<ApiResponse<bool>> DeleteOrderAsync(string id)
        {
            var o = await _databaseLayer.GetOrderByIdAsync(id);
            if (o == null) return ApiResponse<bool>.Fail("Order not found.");

            var result = await _databaseLayer.DeleteOrderAsync(id);
            return ApiResponse<bool>.Ok(result, "Order deleted successfully.");
        }

        public async Task<ApiResponse<List<ChatDto>>> GetChatsByOrderIdAsync(string orderId)
        {
            var chats = await _databaseLayer.GetChatsByOrderIdAsync(orderId);
            return ApiResponse<List<ChatDto>>.Ok(chats);
        }

        public async Task<ApiResponse<ChatDto>> SendChatMessageAsync(string orderId, ChatCreateDto dto)
        {
            var sender = await _authDatabaseLayer.GetUserByIdAsync(dto.SenderId);
            string senderName = sender != null ? $"{sender.FirstName} {sender.LastName}".Trim() : "Unknown";

            var chat = new ChatDb
            {
                Id = "CH-" + new Random().Next(1000, 9999),
                OrderId = orderId,
                SenderId = dto.SenderId,
                Message = dto.Message,
                CreatedAt = DateTime.UtcNow
            };

            var success = await _databaseLayer.InsertChatAsync(chat);
            if (!success)
            {
                return ApiResponse<ChatDto>.Fail("Failed to send chat message.");
            }

            var res = new ChatDto
            {
                Id = chat.Id,
                OrderId = chat.OrderId,
                SenderId = chat.SenderId,
                SenderName = senderName,
                Message = chat.Message,
                CreatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };

            return ApiResponse<ChatDto>.Ok(res, "Message sent.");
        }

        public async Task<ApiResponse<OrderResponseDto>> AcceptOrderAsync(string id, string riderId)
        {
            var o = await _databaseLayer.GetOrderByIdAsync(id);
            if (o == null) return ApiResponse<OrderResponseDto>.Fail("Order not found.");

            if (!string.IsNullOrEmpty(o.RiderId))
            {
                return ApiResponse<OrderResponseDto>.Fail("Order has already been accepted by another rider.");
            }

            var successRider = await _databaseLayer.AssignRiderToOrderAsync(id, riderId);
            if (!successRider)
            {
                return ApiResponse<OrderResponseDto>.Fail("Failed to assign rider to the order.");
            }

            await _databaseLayer.UpdateOrderStatusAsync(id, "preparing");
            o.RiderId = riderId;
            o.Status = "preparing";

            var res = await MapToOrderResponseDtoAsync(o);
            return ApiResponse<OrderResponseDto>.Ok(res, "Order accepted successfully.");
        }

        private async Task<OrderResponseDto> MapToOrderResponseDtoAsync(OrderDb dbOrder)
        {
            var kitchen = await _kitchenDatabaseLayer.GetKitchenByIdAsync(dbOrder.KitchenId);
            var customer = await _authDatabaseLayer.GetUserByIdAsync(dbOrder.CustomerId);

            UserDb? rider = null;
            if (!string.IsNullOrEmpty(dbOrder.RiderId))
            {
                rider = await _authDatabaseLayer.GetUserByIdAsync(dbOrder.RiderId);
            }

            var items = JsonSerializer.Deserialize<List<OrderItemDto>>(dbOrder.ItemsJson) ?? new();

            return new OrderResponseDto
            {
                Id = dbOrder.Id,
                KitchenId = dbOrder.KitchenId,
                KitchenName = kitchen?.Name ?? "Unknown Kitchen",
                CustomerId = dbOrder.CustomerId,
                CustomerName = customer != null ? $"{customer.FirstName} {customer.LastName}".Trim() : "Unknown Customer",
                Items = items,
                Subtotal = dbOrder.Subtotal,
                DeliveryCharge = dbOrder.DeliveryCharge,
                Tax = dbOrder.Tax,
                Discount = dbOrder.Discount,
                Total = dbOrder.Total,
                Status = dbOrder.Status,
                PaymentMethod = dbOrder.PaymentMethod,
                Date = dbOrder.OrderDate,
                RiderId = dbOrder.RiderId,
                RiderName = rider != null ? $"{rider.FirstName} {rider.LastName}".Trim() : "Vikram Singh",
                RiderPhone = rider != null && !string.IsNullOrEmpty(rider.Phone) ? rider.Phone : "+91 9876543210",
                CustomerPhone = customer != null && !string.IsNullOrEmpty(customer.Phone) ? customer.Phone : "+91 9876543210",
                DeliveryAddress = dbOrder.DeliveryAddress,
                PickedUpAt = dbOrder.PickedUpAt?.ToString("yyyy-MM-dd HH:mm:ss"),
                DeliveredAt = dbOrder.DeliveredAt?.ToString("yyyy-MM-dd HH:mm:ss"),
                AcceptedByRiderAt = dbOrder.AcceptedByRiderAt?.ToString("yyyy-MM-dd HH:mm:ss"),
                CreatedAt = dbOrder.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                PickupPhotoUrl = dbOrder.PickupPhotoUrl,
                DeliveryPhotoUrl = dbOrder.DeliveryPhotoUrl,
                IsRiderSettled = dbOrder.IsRiderSettled,
                IsSellerSettled = dbOrder.IsSellerSettled
            };
        }

        public async Task<ApiResponse<List<SupportRoomDto>>> GetSupportRoomsAsync()
        {
            var rooms = await _databaseLayer.GetSupportRoomsAsync();
            return ApiResponse<List<SupportRoomDto>>.Ok(rooms);
        }

        public async Task<ApiResponse<List<AddressDto>>> GetAddressesByUserIdAsync(string userId)
        {
            var dbAddresses = await _databaseLayer.GetAddressesByUserIdAsync(userId);
            var list = new List<AddressDto>();
            foreach (var a in dbAddresses)
            {
                list.Add(new AddressDto
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    AddressName = a.AddressName,
                    AddressLine = a.AddressLine,
                    Latitude = a.Latitude,
                    Longitude = a.Longitude,
                    IsDefault = a.IsDefault
                });
            }
            return ApiResponse<List<AddressDto>>.Ok(list);
        }

        public async Task<ApiResponse<AddressDto>> SaveAddressAsync(AddressDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UserId) || string.IsNullOrWhiteSpace(dto.AddressLine))
                return ApiResponse<AddressDto>.Fail("UserId and AddressLine are required.");

            var address = new AddressDb
            {
                Id = string.IsNullOrEmpty(dto.Id) ? "AD-" + Guid.NewGuid().ToString("N").Substring(0, 8) : dto.Id,
                UserId = dto.UserId,
                AddressName = string.IsNullOrEmpty(dto.AddressName) ? "Home" : dto.AddressName,
                AddressLine = dto.AddressLine,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                IsDefault = dto.IsDefault,
                CreatedAt = DateTime.UtcNow
            };

            var success = await _databaseLayer.InsertAddressAsync(address);
            if (!success) return ApiResponse<AddressDto>.Fail("Failed to save address.");

            dto.Id = address.Id;
            return ApiResponse<AddressDto>.Ok(dto, "Address saved successfully.");
        }

        public async Task<ApiResponse<bool>> DeleteAddressAsync(string id)
        {
            var success = await _databaseLayer.DeleteAddressAsync(id);
            if (!success) return ApiResponse<bool>.Fail("Failed to delete address.");
            return ApiResponse<bool>.Ok(true, "Address deleted successfully.");
        }

        public async Task<ApiResponse<DeliveryPreviewResponseDto>> PreviewDeliveryAsync(DeliveryPreviewRequestDto dto)
        {
            var kitchen = await _kitchenDatabaseLayer.GetKitchenByIdAsync(dto.ShopId);
            if (kitchen == null) return ApiResponse<DeliveryPreviewResponseDto>.Fail("Shop not found.");

            var address = await _databaseLayer.GetAddressByIdAsync(dto.AddressId);
            if (address == null) return ApiResponse<DeliveryPreviewResponseDto>.Fail("Address not found.");

            if (!kitchen.Latitude.HasValue || !kitchen.Longitude.HasValue ||
                !address.Latitude.HasValue || !address.Longitude.HasValue)
            {
                return ApiResponse<DeliveryPreviewResponseDto>.Ok(new DeliveryPreviewResponseDto
                {
                    DistanceKm = 1.5,
                    DeliveryCharge = 10.0m
                }, "Coordinates missing. Using default flat rate settings.");
            }

            double distance = CalculateHaversineDistance(
                (double)kitchen.Latitude.Value, (double)kitchen.Longitude.Value,
                (double)address.Latitude.Value, (double)address.Longitude.Value
            );

            decimal charge = CalculateDeliveryCharge(distance);

            return ApiResponse<DeliveryPreviewResponseDto>.Ok(new DeliveryPreviewResponseDto
            {
                DistanceKm = Math.Round(distance, 2),
                DeliveryCharge = charge
            });
        }

        public async Task<ApiResponse<OrderResponseDto>> AssignNearestRiderAsync(string orderId)
        {
            var order = await _databaseLayer.GetOrderByIdAsync(orderId);
            if (order == null) return ApiResponse<OrderResponseDto>.Fail("Order not found.");

            var kitchen = await _kitchenDatabaseLayer.GetKitchenByIdAsync(order.KitchenId);
            if (kitchen == null) return ApiResponse<OrderResponseDto>.Fail("Shop not found.");

            if (!kitchen.Latitude.HasValue || !kitchen.Longitude.HasValue)
            {
                await _databaseLayer.UpdateOrderStatusAsync(orderId, "ready");
                order.Status = "ready";
                var res = await MapToOrderResponseDtoAsync(order);
                return ApiResponse<OrderResponseDto>.Ok(res, "Order marked ready but shop coordinates are missing.");
            }

            var onlineRiders = await _databaseLayer.GetOnlineRidersAsync();
            if (onlineRiders.Count == 0)
            {
                await _databaseLayer.UpdateOrderStatusAsync(orderId, "ready");
                order.Status = "ready";
                var res = await MapToOrderResponseDtoAsync(order);
                return ApiResponse<OrderResponseDto>.Ok(res, "Order marked as Ready, but no online delivery boys found.");
            }

            RiderLocationDto? nearestRider = null;
            double minDistance = double.MaxValue;

            foreach (var rider in onlineRiders)
            {
                double dist = CalculateHaversineDistance(
                    (double)kitchen.Latitude.Value, (double)kitchen.Longitude.Value,
                    (double)rider.Latitude, (double)rider.Longitude
                );

                if (dist <= 10.0 && dist < minDistance)
                {
                    minDistance = dist;
                    nearestRider = rider;
                }
            }

            if (nearestRider != null)
            {
                await _databaseLayer.AssignRiderToOrderAsync(orderId, nearestRider.RiderId);
                await _databaseLayer.UpdateOrderStatusAsync(orderId, "ready");
                
                order.RiderId = nearestRider.RiderId;
                order.Status = "ready";

                await _databaseLayer.InsertNotificationAsync(
                    nearestRider.RiderId, 
                    "New Delivery Assigned 🚴", 
                    $"Accept order {orderId} from {kitchen.Name}. Pickup Sector: 132. Distance: {Math.Round(minDistance, 2)}km."
                );

                var res = await MapToOrderResponseDtoAsync(order);
                return ApiResponse<OrderResponseDto>.Ok(res, "Rider assigned and order marked as Ready successfully.");
            }
            else
            {
                await _databaseLayer.UpdateOrderStatusAsync(orderId, "ready");
                order.Status = "ready";
                var res = await MapToOrderResponseDtoAsync(order);
                return ApiResponse<OrderResponseDto>.Ok(res, "Order marked as Ready, but no delivery boy available within 10km.");
            }
        }

        private double CalculateHaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371.0;
            double dLat = ToRadians(lat2 - lat1);
            double dLon = ToRadians(lon2 - lon1);

            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        private double ToRadians(double val)
        {
            return (Math.PI / 180.0) * val;
        }

        private decimal CalculateDeliveryCharge(double distanceKm)
        {
            return (decimal)Math.Round(distanceKm, 2) * 5.0m;
        }
    }
}
