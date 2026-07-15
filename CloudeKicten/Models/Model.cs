using System;
using System.Collections.Generic;
using CloudeKicten.Models.DatabaseLayer;

namespace CloudeKicten.Models
{
    // ==========================================
    // Database Entity Models
    // ==========================================

    public class UserDb
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Avatar { get; set; }
        public string? Gender { get; set; }
        public string Role { get; set; } = "customer"; // customer, seller (vendor), rider, superadmin
        public int RewardPoints { get; set; } = 0;
        public string? Otp { get; set; }
        public DateTime? OtpExpiry { get; set; }
        public bool IsVerified { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? UpiNumber { get; set; }
        public string? UpiId { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }
    }

    public class KitchenDb
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string OwnerId { get; set; } = string.Empty;
        public string Type { get; set; } = "restaurant"; // restaurant, home_tiffin
        public string Cuisines { get; set; } = string.Empty;
        public decimal Rating { get; set; } = 5.0m;
        public int RatingCount { get; set; } = 0;
        public string Time { get; set; } = "20-25 mins";
        public string Distance { get; set; } = "1.0 km";
        public string? Offer { get; set; }
        public string? Image { get; set; }
        public decimal Revenue { get; set; } = 0.0m;
        public int OrdersCount { get; set; } = 0;
        public string? LogoUrl { get; set; }
        public string? Address { get; set; }
        public string? Floor { get; set; }
        public string? OfficeGaliNumber { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string IsApproved { get; set; } = "pending"; // pending, approved, rejected
        public string OwnerName { get; set; } = string.Empty;
        public string BankAccount { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }
        public string? OwnerPhone { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? UtrNumber { get; set; }
        public string? PaymentScreenshot { get; set; }
        public bool IsLive { get; set; } = true;
        public string? UpiNumber { get; set; }
        public string? UpiId { get; set; }
    }

    public class ProductDb
    {
        public string Id { get; set; } = string.Empty;
        public string KitchenId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public string Category { get; set; } = string.Empty;
        public bool IsVeg { get; set; }
        public string? Image { get; set; }
        public bool Customizable { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class OrderDb
    {
        public string Id { get; set; } = string.Empty;
        public string KitchenId { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string ItemsJson { get; set; } = "[]"; // Serialized JSON array of OrderItemDto
        public decimal Subtotal { get; set; }
        public decimal DeliveryCharge { get; set; }
        public decimal Tax { get; set; }
        public decimal Discount { get; set; }
        public decimal Total { get; set; }
        public string Status { get; set; } = "placed"; // placed, preparing, ready, on_the_way, delivered, cancelled
        public string PaymentMethod { get; set; } = "cod"; // cod, card, wallet
        public string OrderDate { get; set; } = string.Empty;
        public string? RiderId { get; set; }
        public string? DeliveryAddress { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PickedUpAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DateTime? AcceptedByRiderAt { get; set; }
        public string? PickupPhotoUrl { get; set; }
        public string? DeliveryPhotoUrl { get; set; }
        public bool IsRiderSettled { get; set; } = false;
        public bool IsSellerSettled { get; set; } = false;
    }

    public class SubscriptionDb
    {
        public string Id { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string KitchenId { get; set; } = string.Empty;
        public string PlanName { get; set; } = string.Empty; // e.g. "Monthly Homestyle Veg Meals"
        public int Frequency { get; set; } // 1, 2, or 3 times a day
        public int DurationDays { get; set; } // 7 (weekly) or 30 (monthly)
        public string MealsSelected { get; set; } = string.Empty; // e.g. "Lunch, Dinner"
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Price { get; set; }
        public decimal PaidAmount { get; set; }
        public string PaymentStatus { get; set; } = "unpaid"; // half_paid, fully_paid, unpaid
        public string Status { get; set; } = "active"; // active, suspended, completed
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class BookingDb
    {
        public string Id { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string KitchenId { get; set; } = string.Empty;
        public DateTime BookingDate { get; set; }
        public int GuestCount { get; set; }
        public string? SpecialNotes { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal PaidAmount { get; set; }
        public string PaymentStatus { get; set; } = "unpaid"; // half_paid, fully_paid, unpaid
        public string Status { get; set; } = "pending"; // pending, confirmed, completed, cancelled
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class RiderDb
    {
        public string Id { get; set; } = string.Empty;
        public string VehicleNumber { get; set; } = string.Empty;
        public string LicenseNumber { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public decimal? CurrentLatitude { get; set; }
        public decimal? CurrentLongitude { get; set; }
        public string? DeliveryZone { get; set; }
        public string? RcNumber { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }
        public decimal Rating { get; set; } = 5.0m;
        public int RatingCount { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // User Profile extensions
        public string? Phone { get; set; }
        public string? Gender { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? Avatar { get; set; }
    }

    // ==========================================
    // API Request / Response DTOs
    // ==========================================

    public class RequestOtpDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class VerifyOtpDto
    {
        public string Email { get; set; } = string.Empty;
        public string Otp { get; set; } = string.Empty;
    }

    public class CompleteProfileDto
    {
        public string UserId { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string? Gender { get; set; }
        public string? Phone { get; set; }
        public string? Role { get; set; }
        public string? UpiNumber { get; set; }
        public string? UpiId { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }
    }

    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Avatar { get; set; }
        public string? Gender { get; set; }
        public string Role { get; set; } = "customer";
        public int RewardPoints { get; set; }
        public string? UpiNumber { get; set; }
        public string? UpiId { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public bool IsNewUser { get; set; } = false;
        public UserDto User { get; set; } = new();
    }

    public class RiderRegisterDto
    {
        public string UserId { get; set; } = string.Empty;
        public string VehicleNumber { get; set; } = string.Empty;
        public string LicenseNumber { get; set; } = string.Empty;
        public string? DeliveryZone { get; set; }
        public string? RcNumber { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }
    }

    public class VendorRegisterDto
    {
        public string UserId { get; set; } = string.Empty;
        public string KitchenName { get; set; } = string.Empty;
        public string Type { get; set; } = "home_tiffin"; // restaurant, home_tiffin
        public string Cuisines { get; set; } = string.Empty;
    }

    public class KitchenCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string OwnerId { get; set; } = string.Empty;
        public string Type { get; set; } = "restaurant";
        public string Cuisines { get; set; } = string.Empty;
        public string Time { get; set; } = "20-25 mins";
        public string Distance { get; set; } = "1.0 km";
        public string? Offer { get; set; }
        public string? Image { get; set; }
        public string? LogoUrl { get; set; }
        public string? Address { get; set; }
        public string? Floor { get; set; }
        public string? OfficeGaliNumber { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string IsApproved { get; set; } = "pending";
        public string? BankAccount { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }
        public string? UtrNumber { get; set; }
        public string? PaymentScreenshot { get; set; }
        public bool IsLive { get; set; } = true;
    }

    public class KitchenUpdateDto
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = "restaurant";
        public string Cuisines { get; set; } = string.Empty;
        public string Time { get; set; } = "20-25 mins";
        public string Distance { get; set; } = "1.0 km";
        public string? Offer { get; set; }
        public string? Image { get; set; }
        public string? LogoUrl { get; set; }
        public string? Address { get; set; }
        public string? Floor { get; set; }
        public string? OfficeGaliNumber { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string IsApproved { get; set; } = "pending";
        public string? BankAccount { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }
        public string? UtrNumber { get; set; }
        public string? PaymentScreenshot { get; set; }
        public bool IsLive { get; set; } = true;
    }

    public class ProductCreateDto
    {
        public string KitchenId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public string Category { get; set; } = string.Empty;
        public bool IsVeg { get; set; }
        public string? Image { get; set; }
        public bool Customizable { get; set; }
    }

    public class ProductUpdateDto
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public string Category { get; set; } = string.Empty;
        public bool IsVeg { get; set; }
        public string? Image { get; set; }
        public bool Customizable { get; set; }
    }

    public class OrderItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
    }

    public class OrderCreateDto
    {
        public string KitchenId { get; set; } = string.Empty;
        public string KitchenName { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public List<OrderItemDto> Items { get; set; } = new();
        public decimal Subtotal { get; set; }
        public decimal DeliveryCharge { get; set; }
        public decimal Tax { get; set; }
        public decimal Discount { get; set; }
        public decimal Total { get; set; }
        public string PaymentMethod { get; set; } = "cod";
        public string? DeliveryAddress { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
    }

    public class OrderResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string KitchenId { get; set; } = string.Empty;
        public string KitchenName { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public List<OrderItemDto> Items { get; set; } = new();
        public decimal Subtotal { get; set; }
        public decimal DeliveryCharge { get; set; }
        public decimal Tax { get; set; }
        public decimal Discount { get; set; }
        public decimal Total { get; set; }
        public string Status { get; set; } = "placed";
        public string PaymentMethod { get; set; } = "cod";
        public string Date { get; set; } = string.Empty;
        public string? RiderId { get; set; }
        public string? RiderName { get; set; }
        public string? RiderPhone { get; set; }
        public string? CustomerPhone { get; set; }
        public string? DeliveryAddress { get; set; }
        public string? PickedUpAt { get; set; }
        public string? DeliveredAt { get; set; }
        public string? AcceptedByRiderAt { get; set; }
        public string? CreatedAt { get; set; }
        public string? PickupPhotoUrl { get; set; }
        public string? DeliveryPhotoUrl { get; set; }
        public bool IsRiderSettled { get; set; }
        public bool IsSellerSettled { get; set; }
        public decimal? ShopLatitude { get; set; }
        public decimal? ShopLongitude { get; set; }
        public decimal? CustomerLatitude { get; set; }
        public decimal? CustomerLongitude { get; set; }
    }

    public class RateRiderDto
    {
        public int Rating { get; set; }
    }

    public class RiderProfileUpdateDto
    {
        public string VehicleNumber { get; set; } = string.Empty;
        public string LicenseNumber { get; set; } = string.Empty;
        public string? RcNumber { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }
        public string? DeliveryZone { get; set; }
        public string? Phone { get; set; }
        public string? Gender { get; set; }
    }

    public class OrderStatusUpdateDto
    {
        public string Status { get; set; } = string.Empty;
        public string? PickupPhotoUrl { get; set; }
        public string? DeliveryPhotoUrl { get; set; }
    }

    public class AssignRiderDto
    {
        public string RiderId { get; set; } = string.Empty;
    }

    // Subscriptions
    public class SubscriptionCreateDto
    {
        public string CustomerId { get; set; } = string.Empty;
        public string KitchenId { get; set; } = string.Empty;
        public string PlanName { get; set; } = string.Empty;
        public int Frequency { get; set; } // 1, 2, or 3 times a day
        public int DurationDays { get; set; } // 7 or 30 days
        public string MealsSelected { get; set; } = string.Empty; // e.g. "Lunch, Dinner"
        public decimal Price { get; set; }
        public decimal PaidAmount { get; set; }
        public string PaymentStatus { get; set; } = "unpaid"; // half_paid, fully_paid, unpaid
    }

    public class SubscriptionResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string KitchenId { get; set; } = string.Empty;
        public string KitchenName { get; set; } = string.Empty;
        public string PlanName { get; set; } = string.Empty;
        public int Frequency { get; set; }
        public int DurationDays { get; set; }
        public string MealsSelected { get; set; } = string.Empty;
        public string StartDate { get; set; } = string.Empty;
        public string EndDate { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal PaidAmount { get; set; }
        public string PaymentStatus { get; set; } = "unpaid";
        public string Status { get; set; } = "active";
    }

    public class SubscriptionStatusUpdateDto
    {
        public string Status { get; set; } = string.Empty; // active, suspended, completed
    }

    // Bookings
    public class BookingCreateDto
    {
        public string CustomerId { get; set; } = string.Empty;
        public string KitchenId { get; set; } = string.Empty;
        public string BookingDateString { get; set; } = string.Empty; // ISO Date String
        public int GuestCount { get; set; }
        public string? SpecialNotes { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal PaidAmount { get; set; }
        public string PaymentStatus { get; set; } = "unpaid"; // half_paid, fully_paid
    }

    public class BookingResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string KitchenId { get; set; } = string.Empty;
        public string KitchenName { get; set; } = string.Empty;
        public string BookingDate { get; set; } = string.Empty;
        public int GuestCount { get; set; }
        public string? SpecialNotes { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal PaidAmount { get; set; }
        public string PaymentStatus { get; set; } = "unpaid";
        public string Status { get; set; } = "pending";
    }

    public class BookingStatusUpdateDto
    {
        public string Status { get; set; } = string.Empty; // pending, confirmed, completed, cancelled
    }

    // Rider DTOs
    public class RiderLocationUpdateDto
    {
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
    }

    public class RiderStatusUpdateDto
    {
        public bool IsActive { get; set; }
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }

        public static ApiResponse<T> Ok(T data, string message = "Success") => 
            new() { Success = true, Data = data, Message = message };

        public static ApiResponse<T> Fail(string message) => 
            new() { Success = false, Message = message };
    }

    public class ChatDb
    {
        public string Id { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public string SenderId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ChatDto
    {
        public string Id { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public string SenderId { get; set; } = string.Empty;
        public string SenderName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string CreatedAt { get; set; } = string.Empty;
    }

    public class ChatCreateDto
    {
      public string SenderId { get; set; } = string.Empty;
      public string Message { get; set; } = string.Empty;
    }

    public class SupportRoomDto
    {
      public string OrderId { get; set; } = string.Empty;
      public string CustomerId { get; set; } = string.Empty;
      public string CustomerName { get; set; } = string.Empty;
    }

    public class PayoutCycleInfoDto
    {
        public decimal UnpaidBalance { get; set; }
        public int DaysRemaining { get; set; }
        public string NextPayoutDate { get; set; } = string.Empty;
        public decimal LastPayoutAmount { get; set; }
        public string LastPayoutDate { get; set; } = string.Empty;
        public string LastPayoutStatus { get; set; } = string.Empty;
        public List<SettlementDb> PayoutHistory { get; set; } = new();
    }

    public class AddressDb
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string AddressName { get; set; } = string.Empty;
        public string AddressLine { get; set; } = string.Empty;
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public bool IsDefault { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class AddressDto
    {
        public string? Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string AddressName { get; set; } = string.Empty;
        public string AddressLine { get; set; } = string.Empty;
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public bool IsDefault { get; set; }
    }

    public class DeliveryPreviewRequestDto
    {
        public string ShopId { get; set; } = string.Empty;
        public string AddressId { get; set; } = string.Empty;
    }

    public class DeliveryPreviewResponseDto
    {
        public double DistanceKm { get; set; }
        public decimal DeliveryCharge { get; set; }
    }

    public class RiderLocationDto
    {
        public string RiderId { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
    }
}
