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
        Task<ApiResponse<OrderResponseDto>> GetOrderByIdAsync(string id);
        Task<ApiResponse<OrderResponseDto>> CreateOrderAsync(OrderCreateDto dto);
        Task<ApiResponse<OrderResponseDto>> UpdateOrderStatusAsync(string id, string status);
        Task<ApiResponse<bool>> DeleteOrderAsync(string id);
        Task<ApiResponse<List<ChatDto>>> GetChatsByOrderIdAsync(string orderId);
        Task<ApiResponse<ChatDto>> SendChatMessageAsync(string orderId, ChatCreateDto dto);
        Task<ApiResponse<OrderResponseDto>> AcceptOrderAsync(string id, string riderId);
    }

    public class BusinessLayer_OrderController : IBusinessLayer_OrderController
    {
        private readonly IDatabaseLayer_OrderController _databaseLayer;
        private readonly IDatabaseLayer_KitchenController _kitchenDatabaseLayer;
        private readonly IDatabaseLayer_AuthController _authDatabaseLayer;

        public BusinessLayer_OrderController(
            IDatabaseLayer_OrderController databaseLayer,
            IDatabaseLayer_KitchenController kitchenDatabaseLayer,
            IDatabaseLayer_AuthController authDatabaseLayer)
        {
            this._databaseLayer = databaseLayer;
            this._kitchenDatabaseLayer = kitchenDatabaseLayer;
            this._authDatabaseLayer = authDatabaseLayer;
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

            string orderId = "CK-" + new Random().Next(1000, 9999);
            string orderDate = DateTime.Now.ToString("dd MMMM, h:mm tt") + " today";

            var order = new OrderDb
            {
                Id = orderId,
                KitchenId = dto.KitchenId,
                CustomerId = dto.CustomerId,
                ItemsJson = JsonSerializer.Serialize(dto.Items),
                Subtotal = dto.Subtotal,
                DeliveryCharge = dto.DeliveryCharge,
                Tax = dto.Tax,
                Discount = dto.Discount,
                Total = dto.Total,
                Status = "placed",
                PaymentMethod = dto.PaymentMethod,
                OrderDate = orderDate
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

        public async Task<ApiResponse<OrderResponseDto>> UpdateOrderStatusAsync(string id, string status)
        {
            var o = await _databaseLayer.GetOrderByIdAsync(id);
            if (o == null) return ApiResponse<OrderResponseDto>.Fail("Order not found.");

            await _databaseLayer.UpdateOrderStatusAsync(id, status);
            o.Status = status;

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
                RiderPhone = rider != null && !string.IsNullOrEmpty(rider.Phone) ? rider.Phone : "+91 9876543210"
            };
        }
    }
}
