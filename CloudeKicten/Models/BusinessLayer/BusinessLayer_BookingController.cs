using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CloudeKicten.Models.DatabaseLayer;

namespace CloudeKicten.Models.BusinessLayer
{
    public interface IBusinessLayer_BookingController
    {
        Task<ApiResponse<List<BookingResponseDto>>> GetAllBookingsAsync();
        Task<ApiResponse<List<BookingResponseDto>>> GetBookingsByCustomerIdAsync(string customerId);
        Task<ApiResponse<List<BookingResponseDto>>> GetBookingsByKitchenIdAsync(string kitchenId);
        Task<ApiResponse<BookingResponseDto>> GetBookingByIdAsync(string id);
        Task<ApiResponse<BookingResponseDto>> CreateBookingAsync(BookingCreateDto dto);
        Task<ApiResponse<BookingResponseDto>> UpdateBookingStatusAsync(string id, string status);
    }

    public class BusinessLayer_BookingController : IBusinessLayer_BookingController
    {
        private readonly IDatabaseLayer_BookingController _databaseLayer;
        private readonly IDatabaseLayer_KitchenController _kitchenDatabaseLayer;
        private readonly IDatabaseLayer_AuthController _authDatabaseLayer;

        public BusinessLayer_BookingController(
            IDatabaseLayer_BookingController databaseLayer,
            IDatabaseLayer_KitchenController kitchenDatabaseLayer,
            IDatabaseLayer_AuthController authDatabaseLayer)
        {
            this._databaseLayer = databaseLayer;
            this._kitchenDatabaseLayer = kitchenDatabaseLayer;
            this._authDatabaseLayer = authDatabaseLayer;
        }

        public async Task<ApiResponse<List<BookingResponseDto>>> GetAllBookingsAsync()
        {
            var list = await _databaseLayer.GetAllBookingsAsync();
            var res = new List<BookingResponseDto>();
            foreach (var b in list)
            {
                res.Add(await MapToDto(b));
            }
            return ApiResponse<List<BookingResponseDto>>.Ok(res);
        }

        public async Task<ApiResponse<List<BookingResponseDto>>> GetBookingsByCustomerIdAsync(string customerId)
        {
            var list = await _databaseLayer.GetBookingsByCustomerIdAsync(customerId);
            var res = new List<BookingResponseDto>();
            foreach (var b in list)
            {
                res.Add(await MapToDto(b));
            }
            return ApiResponse<List<BookingResponseDto>>.Ok(res);
        }

        public async Task<ApiResponse<List<BookingResponseDto>>> GetBookingsByKitchenIdAsync(string kitchenId)
        {
            var list = await _databaseLayer.GetBookingsByKitchenIdAsync(kitchenId);
            var res = new List<BookingResponseDto>();
            foreach (var b in list)
            {
                res.Add(await MapToDto(b));
            }
            return ApiResponse<List<BookingResponseDto>>.Ok(res);
        }

        public async Task<ApiResponse<BookingResponseDto>> GetBookingByIdAsync(string id)
        {
            var b = await _databaseLayer.GetBookingByIdAsync(id);
            if (b == null) return ApiResponse<BookingResponseDto>.Fail("Booking not found.");
            var res = await MapToDto(b);
            return ApiResponse<BookingResponseDto>.Ok(res);
        }

        public async Task<ApiResponse<BookingResponseDto>> CreateBookingAsync(BookingCreateDto dto)
        {
            var customer = await _authDatabaseLayer.GetUserByIdAsync(dto.CustomerId);
            if (customer == null)
                return ApiResponse<BookingResponseDto>.Fail($"Customer ID '{dto.CustomerId}' not found.");

            var kitchen = await _kitchenDatabaseLayer.GetKitchenByIdAsync(dto.KitchenId);
            if (kitchen == null)
                return ApiResponse<BookingResponseDto>.Fail($"Kitchen ID '{dto.KitchenId}' not found.");

            if (!DateTime.TryParse(dto.BookingDateString, out DateTime bookingDate))
            {
                return ApiResponse<BookingResponseDto>.Fail("Invalid booking date format.");
            }

            string id = "BKG-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();

            var b = new BookingDb
            {
                Id = id,
                CustomerId = dto.CustomerId,
                KitchenId = dto.KitchenId,
                BookingDate = bookingDate,
                GuestCount = dto.GuestCount,
                SpecialNotes = dto.SpecialNotes,
                TotalPrice = dto.TotalPrice,
                PaidAmount = dto.PaidAmount,
                PaymentStatus = dto.PaymentStatus,
                Status = "pending"
            };

            await _databaseLayer.InsertBookingAsync(b);

            var res = await MapToDto(b);
            return ApiResponse<BookingResponseDto>.Ok(res, "Kitchen booking submitted successfully.");
        }

        public async Task<ApiResponse<BookingResponseDto>> UpdateBookingStatusAsync(string id, string status)
        {
            var b = await _databaseLayer.GetBookingByIdAsync(id);
            if (b == null) return ApiResponse<BookingResponseDto>.Fail("Booking not found.");

            await _databaseLayer.UpdateBookingStatusAsync(id, status);
            b.Status = status;

            var res = await MapToDto(b);
            return ApiResponse<BookingResponseDto>.Ok(res, "Booking status updated successfully.");
        }

        private async Task<BookingResponseDto> MapToDto(BookingDb b)
        {
            var customer = await _authDatabaseLayer.GetUserByIdAsync(b.CustomerId);
            var kitchen = await _kitchenDatabaseLayer.GetKitchenByIdAsync(b.KitchenId);

            return new BookingResponseDto
            {
                Id = b.Id,
                CustomerId = b.CustomerId,
                CustomerName = customer != null ? $"{customer.FirstName} {customer.LastName}".Trim() : "Unknown Customer",
                KitchenId = b.KitchenId,
                KitchenName = kitchen?.Name ?? "Unknown Kitchen",
                BookingDate = b.BookingDate.ToString("dd MMM yyyy, hh:mm tt"),
                GuestCount = b.GuestCount,
                SpecialNotes = b.SpecialNotes,
                TotalPrice = b.TotalPrice,
                PaidAmount = b.PaidAmount,
                PaymentStatus = b.PaymentStatus,
                Status = b.Status
            };
        }
    }
}
