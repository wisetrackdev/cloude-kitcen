using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CloudeKicten.Models
{
    public class PaymentDb
    {
        public string Id { get; set; } = string.Empty;
        public string? OrderId { get; set; }
        public string? SubscriptionId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "UPI";
        public string TransactionId { get; set; } = string.Empty;
        public string Utr { get; set; } = string.Empty;
        public string Status { get; set; } = "success";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class PaymentVerifyRequestDto
    {
        [Required(ErrorMessage = "Transaction ID is required.")]
        public string TransactionId { get; set; } = string.Empty;

        [Required(ErrorMessage = "UTR number is required.")]
        [MinLength(6, ErrorMessage = "UTR Number must be at least 6 digits.")]
        public string UtrNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "User ID is required.")]
        public string UserId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Kitchen ID is required.")]
        public string KitchenId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Delivery address is required.")]
        public string DeliveryAddress { get; set; } = string.Empty;

        [Range(0.01, 1000000, ErrorMessage = "Total amount must be greater than zero.")]
        public decimal TotalAmount { get; set; }

        public decimal Subtotal { get; set; }
        public decimal DeliveryCharge { get; set; }
        public decimal Tax { get; set; }
        public decimal Discount { get; set; }

        [Required(ErrorMessage = "At least one order item is required.")]
        public List<OrderItemDto> Items { get; set; } = new();
    }

    public class PaymentVerifyResponseDto
    {
        public string OrderId { get; set; } = string.Empty;
        public string PaymentId { get; set; } = string.Empty;
        public string OrderNumber { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string OrderStatus { get; set; } = string.Empty;
        public DateTime CreatedOn { get; set; }
    }
}
