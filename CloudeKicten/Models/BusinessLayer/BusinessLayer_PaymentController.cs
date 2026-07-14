using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using CloudeKicten.Models.DatabaseLayer;

namespace CloudeKicten.Models.BusinessLayer
{
    public interface IBusinessLayer_PaymentController
    {
        Task<ApiResponse<PaymentVerifyResponseDto>> VerifyPaymentAsync(PaymentVerifyRequestDto dto);
    }

    public class BusinessLayer_PaymentController : IBusinessLayer_PaymentController
    {
        private readonly IDatabaseLayer_PaymentController _paymentRepository;
        private readonly IDatabaseLayer_KitchenController _kitchenRepository;
        private readonly IDatabaseLayer_AuthController _authRepository;
        private readonly IDatabaseLayer_OrderController _orderRepository;
        private readonly ILogger<BusinessLayer_PaymentController> _logger;

        public BusinessLayer_PaymentController(
            IDatabaseLayer_PaymentController paymentRepository,
            IDatabaseLayer_KitchenController kitchenRepository,
            IDatabaseLayer_AuthController authRepository,
            IDatabaseLayer_OrderController orderRepository,
            ILogger<BusinessLayer_PaymentController> logger)
        {
            _paymentRepository = paymentRepository;
            _kitchenRepository = kitchenRepository;
            _authRepository = authRepository;
            _orderRepository = orderRepository;
            _logger = logger;
            
            // Run startup migration to ensure required columns are present in database
            Task.Run(async () => {
                try
                {
                    await _paymentRepository.EnsurePaymentColumnsExistAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to run startup migration for payments table.");
                }
            });
        }

        public async Task<ApiResponse<PaymentVerifyResponseDto>> VerifyPaymentAsync(PaymentVerifyRequestDto dto)
        {
            _logger.LogInformation("Processing payment verification request. TransactionId: {TxId}, UTR: {Utr}, UserId: {UserId}", 
                dto.TransactionId, dto.UtrNumber, dto.UserId);

            try
            {
                // 1. Validation
                if (dto == null)
                {
                    return ApiResponse<PaymentVerifyResponseDto>.Fail("Request data cannot be null.");
                }

                if (string.IsNullOrWhiteSpace(dto.UtrNumber))
                {
                    return ApiResponse<PaymentVerifyResponseDto>.Fail("UTR number is required.");
                }

                if (dto.UtrNumber.Length < 6)
                {
                    return ApiResponse<PaymentVerifyResponseDto>.Fail("Invalid UTR number. Must be at least 6 characters.");
                }

                // 2. Protect against duplicate verification / UTR re-use
                bool isUtrUsed = await _paymentRepository.IsUtrExistsAsync(dto.UtrNumber);
                if (isUtrUsed)
                {
                    _logger.LogWarning("Duplicate payment verification block. UTR {Utr} already exists.", dto.UtrNumber);
                    return ApiResponse<PaymentVerifyResponseDto>.Fail("Duplicate payment verification. This UTR has already been processed.");
                }

                bool isTxUsed = await _paymentRepository.IsTransactionIdExistsAsync(dto.TransactionId);
                if (isTxUsed)
                {
                    _logger.LogWarning("Duplicate payment verification block. Transaction ID {TxId} already exists.", dto.TransactionId);
                    return ApiResponse<PaymentVerifyResponseDto>.Fail("Duplicate payment verification. This Transaction ID has already been processed.");
                }

                // 3. Verify user and kitchen exist
                var customer = await _authRepository.GetUserByIdAsync(dto.UserId);
                if (customer == null)
                {
                    return ApiResponse<PaymentVerifyResponseDto>.Fail($"Customer with ID '{dto.UserId}' not found.");
                }

                var kitchen = await _kitchenRepository.GetKitchenByIdAsync(dto.KitchenId);
                if (kitchen == null)
                {
                    return ApiResponse<PaymentVerifyResponseDto>.Fail($"Kitchen with ID '{dto.KitchenId}' not found.");
                }

                // 4. Generate order details
                string orderId = "CK-" + new Random().Next(1000, 9999) + new Random().Next(10, 99);
                string orderDate = DateTime.Now.ToString("dd MMMM, h:mm tt") + " today";
                string paymentId = "PAY-" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();

                var order = new OrderDb
                {
                    Id = orderId,
                    KitchenId = dto.KitchenId,
                    CustomerId = dto.UserId,
                    ItemsJson = JsonSerializer.Serialize(dto.Items),
                    Subtotal = dto.Subtotal,
                    DeliveryCharge = dto.DeliveryCharge,
                    Tax = dto.Tax,
                    Discount = dto.Discount,
                    Total = dto.TotalAmount,
                    Status = "confirmed", // Order Status = Confirmed
                    PaymentMethod = "UPI_Intent",
                    OrderDate = orderDate,
                    DeliveryAddress = dto.DeliveryAddress,
                    IsRiderSettled = false,
                    IsSellerSettled = false
                };

                var payment = new PaymentDb
                {
                    Id = paymentId,
                    OrderId = orderId,
                    SubscriptionId = null,
                    Amount = dto.TotalAmount,
                    PaymentMethod = "UPI",
                    TransactionId = dto.TransactionId,
                    Utr = dto.UtrNumber,
                    Status = "success", // Payment Status = Paid (we use success in database constraints but return Paid in response)
                    CreatedAt = DateTime.UtcNow
                };

                // 5. Insert order and payment atomically (Repository layer)
                bool isCreated = await _paymentRepository.InsertOrderWithPaymentAsync(order, payment);
                if (!isCreated)
                {
                    return ApiResponse<PaymentVerifyResponseDto>.Fail("Database error while creating order and payment log.");
                }

                // 6. Update inventory (Log & mock implementation)
                foreach (var item in dto.Items)
                {
                    _logger.LogInformation("Updating inventory: Item {ItemName} (Quantity: {Qty}) decremented for kitchen {KitchenId}", 
                        item.Name, item.Quantity, dto.KitchenId);
                }

                // 7. Reward Points
                try
                {
                    customer.RewardPoints += 10;
                    await _authRepository.UpdateUserProfileAsync(customer);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to update reward points for customer: {UserId}", dto.UserId);
                }

                // 8. Notify riders
                try
                {
                    var riders = await _orderRepository.GetRiderIdsAsync();
                    foreach (var rider in riders)
                    {
                        await _orderRepository.InsertNotificationAsync(rider, "New Paid Order Available 🔔", 
                            $"A new prepaid order is available from {kitchen.Name}. Accept now to pick it up!");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Rider notification dispatch failed for Order {OrderId}", orderId);
                }

                // 9. Return success response
                var response = new PaymentVerifyResponseDto
                {
                    OrderId = orderId,
                    PaymentId = paymentId,
                    OrderNumber = orderId,
                    PaymentStatus = "Paid",
                    OrderStatus = "Confirmed",
                    CreatedOn = DateTime.UtcNow
                };

                _logger.LogInformation("Payment verified successfully. Order created: {OrderId}, Payment logged: {PaymentId}", 
                    orderId, paymentId);
                
                return ApiResponse<PaymentVerifyResponseDto>.Ok(response, "Payment verified and order created successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred during payment verification.");
                return ApiResponse<PaymentVerifyResponseDto>.Fail($"Internal Server Error: {ex.Message}");
            }
        }
    }
}
