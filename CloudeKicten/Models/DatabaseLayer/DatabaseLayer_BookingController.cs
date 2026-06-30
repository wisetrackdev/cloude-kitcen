using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace CloudeKicten.Models.DatabaseLayer
{
    public interface IDatabaseLayer_BookingController
    {
        Task<List<BookingDb>> GetAllBookingsAsync();
        Task<List<BookingDb>> GetBookingsByCustomerIdAsync(string customerId);
        Task<List<BookingDb>> GetBookingsByKitchenIdAsync(string kitchenId);
        Task<BookingDb?> GetBookingByIdAsync(string id);
        Task<bool> InsertBookingAsync(BookingDb booking);
        Task<bool> UpdateBookingStatusAsync(string id, string status);
    }

    public class DatabaseLayer_BookingController : IDatabaseLayer_BookingController
    {
        private readonly IConfiguration _configuration;
        private readonly string DbConnection;

        public DatabaseLayer_BookingController(IConfiguration configuration)
        {
            this._configuration = configuration;
            this.DbConnection = this._configuration.GetConnectionString("AppDbContext") 
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found.");
        }

        private NpgsqlConnection GetConnection() => new NpgsqlConnection(DbConnection);

        public async Task<List<BookingDb>> GetAllBookingsAsync()
        {
            var list = new List<BookingDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetAllBookings, conn);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(MapBooking(reader));
            }
            return list;
        }

        public async Task<List<BookingDb>> GetBookingsByCustomerIdAsync(string customerId)
        {
            var list = new List<BookingDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetBookingsByCustomerId, conn);
            cmd.Parameters.AddWithValue("@CustomerId", customerId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(MapBooking(reader));
            }
            return list;
        }

        public async Task<List<BookingDb>> GetBookingsByKitchenIdAsync(string kitchenId)
        {
            var list = new List<BookingDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetBookingsByKitchenId, conn);
            cmd.Parameters.AddWithValue("@KitchenId", kitchenId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(MapBooking(reader));
            }
            return list;
        }

        public async Task<BookingDb?> GetBookingByIdAsync(string id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetBookingById, conn);
            cmd.Parameters.AddWithValue("@Id", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapBooking(reader);
            }
            return null;
        }

        public async Task<bool> InsertBookingAsync(BookingDb b)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.InsertBooking, conn);
            cmd.Parameters.AddWithValue("@Id", b.Id);
            cmd.Parameters.AddWithValue("@CustomerId", b.CustomerId);
            cmd.Parameters.AddWithValue("@KitchenId", b.KitchenId);
            cmd.Parameters.AddWithValue("@BookingDate", b.BookingDate);
            cmd.Parameters.AddWithValue("@GuestCount", b.GuestCount);
            cmd.Parameters.AddWithValue("@SpecialNotes", (object?)b.SpecialNotes ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@TotalPrice", b.TotalPrice);
            cmd.Parameters.AddWithValue("@PaidAmount", b.PaidAmount);
            cmd.Parameters.AddWithValue("@PaymentStatus", b.PaymentStatus);
            cmd.Parameters.AddWithValue("@Status", b.Status);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> UpdateBookingStatusAsync(string id, string status)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.UpdateBookingStatus, conn);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@Status", status);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        private static BookingDb MapBooking(NpgsqlDataReader r)
        {
            return new BookingDb
            {
                Id = r.GetString(r.GetOrdinal("id")),
                CustomerId = r.GetString(r.GetOrdinal("customer_id")),
                KitchenId = r.GetString(r.GetOrdinal("kitchen_id")),
                BookingDate = r.GetDateTime(r.GetOrdinal("booking_date")),
                GuestCount = r.GetInt32(r.GetOrdinal("guest_count")),
                SpecialNotes = r.IsDBNull(r.GetOrdinal("special_notes")) ? null : r.GetString(r.GetOrdinal("special_notes")),
                TotalPrice = r.GetDecimal(r.GetOrdinal("total_price")),
                PaidAmount = r.GetDecimal(r.GetOrdinal("paid_amount")),
                PaymentStatus = r.GetString(r.GetOrdinal("payment_status")),
                Status = r.GetString(r.GetOrdinal("status")),
                CreatedAt = r.GetDateTime(r.GetOrdinal("created_at"))
            };
        }
    }
}
