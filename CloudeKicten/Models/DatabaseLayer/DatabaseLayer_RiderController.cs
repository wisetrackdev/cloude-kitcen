using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace CloudeKicten.Models.DatabaseLayer
{
    public interface IDatabaseLayer_RiderController
    {
        Task<RiderDb?> GetRiderByIdAsync(string id);
        Task<List<RiderDb>> GetAllRidersAsync();
        Task<bool> InsertRiderAsync(RiderDb rider);
        Task<bool> UpdateRiderProfileAsync(RiderDb rider);
        Task<bool> UpdateRiderRatingAsync(string riderId, int rating);
        Task<bool> UpdateRiderLocationAsync(string id, decimal latitude, decimal longitude);
        Task<bool> UpdateRiderStatusAsync(string id, bool isActive);
    }

    public class DatabaseLayer_RiderController : IDatabaseLayer_RiderController
    {
        private readonly IConfiguration _configuration;
        private readonly string DbConnection;

        public DatabaseLayer_RiderController(IConfiguration configuration)
        {
            this._configuration = configuration;
            this.DbConnection = this._configuration.GetConnectionString("AppDbContext") 
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found.");
        }

        private NpgsqlConnection GetConnection() => new NpgsqlConnection(DbConnection);

        public async Task<RiderDb?> GetRiderByIdAsync(string id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetRiderById, conn);
            cmd.Parameters.AddWithValue("@Id", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new RiderDb
                {
                    Id = reader.GetString(reader.GetOrdinal("id")),
                    VehicleType = reader.IsDBNull(reader.GetOrdinal("vehicle_type")) ? null : reader.GetString(reader.GetOrdinal("vehicle_type")),
                    VehicleNumber = reader.GetString(reader.GetOrdinal("vehicle_number")),
                    LicenseNumber = reader.GetString(reader.GetOrdinal("license_number")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("is_active")),
                    CurrentLatitude = reader.IsDBNull(reader.GetOrdinal("current_latitude")) ? null : reader.GetDecimal(reader.GetOrdinal("current_latitude")),
                    CurrentLongitude = reader.IsDBNull(reader.GetOrdinal("current_longitude")) ? null : reader.GetDecimal(reader.GetOrdinal("current_longitude")),
                    DeliveryZone = reader.IsDBNull(reader.GetOrdinal("delivery_zone")) ? null : reader.GetString(reader.GetOrdinal("delivery_zone")),
                    RcNumber = reader.IsDBNull(reader.GetOrdinal("rc_number")) ? null : reader.GetString(reader.GetOrdinal("rc_number")),
                    BankName = reader.IsDBNull(reader.GetOrdinal("bank_name")) ? null : reader.GetString(reader.GetOrdinal("bank_name")),
                    AccountNumber = reader.IsDBNull(reader.GetOrdinal("account_number")) ? null : reader.GetString(reader.GetOrdinal("account_number")),
                    IfscCode = reader.IsDBNull(reader.GetOrdinal("ifsc_code")) ? null : reader.GetString(reader.GetOrdinal("ifsc_code")),
                    Rating = reader.IsDBNull(reader.GetOrdinal("rating")) ? 5.0m : reader.GetDecimal(reader.GetOrdinal("rating")),
                    RatingCount = reader.IsDBNull(reader.GetOrdinal("rating_count")) ? 0 : reader.GetInt32(reader.GetOrdinal("rating_count")),
                    Phone = reader.IsDBNull(reader.GetOrdinal("phone_number")) ? null : reader.GetString(reader.GetOrdinal("phone_number")),
                    Gender = reader.IsDBNull(reader.GetOrdinal("gender")) ? null : reader.GetString(reader.GetOrdinal("gender")),
                    FirstName = reader.IsDBNull(reader.GetOrdinal("first_name")) ? null : reader.GetString(reader.GetOrdinal("first_name")),
                    LastName = reader.IsDBNull(reader.GetOrdinal("last_name")) ? null : reader.GetString(reader.GetOrdinal("last_name")),
                    Email = reader.IsDBNull(reader.GetOrdinal("email")) ? null : reader.GetString(reader.GetOrdinal("email")),
                    CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at"))
                };
            }
            return null;
        }

        public async Task<List<RiderDb>> GetAllRidersAsync()
        {
            var list = new List<RiderDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetAllRiders, conn);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new RiderDb
                {
                    Id = reader.GetString(reader.GetOrdinal("id")),
                    VehicleType = reader.IsDBNull(reader.GetOrdinal("vehicle_type")) ? null : reader.GetString(reader.GetOrdinal("vehicle_type")),
                    VehicleNumber = reader.GetString(reader.GetOrdinal("vehicle_number")),
                    LicenseNumber = reader.GetString(reader.GetOrdinal("license_number")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("is_active")),
                    CurrentLatitude = reader.IsDBNull(reader.GetOrdinal("current_latitude")) ? null : reader.GetDecimal(reader.GetOrdinal("current_latitude")),
                    CurrentLongitude = reader.IsDBNull(reader.GetOrdinal("current_longitude")) ? null : reader.GetDecimal(reader.GetOrdinal("current_longitude")),
                    DeliveryZone = reader.IsDBNull(reader.GetOrdinal("delivery_zone")) ? null : reader.GetString(reader.GetOrdinal("delivery_zone")),
                    RcNumber = reader.IsDBNull(reader.GetOrdinal("rc_number")) ? null : reader.GetString(reader.GetOrdinal("rc_number")),
                    BankName = reader.IsDBNull(reader.GetOrdinal("bank_name")) ? null : reader.GetString(reader.GetOrdinal("bank_name")),
                    AccountNumber = reader.IsDBNull(reader.GetOrdinal("account_number")) ? null : reader.GetString(reader.GetOrdinal("account_number")),
                    IfscCode = reader.IsDBNull(reader.GetOrdinal("ifsc_code")) ? null : reader.GetString(reader.GetOrdinal("ifsc_code")),
                    Rating = reader.IsDBNull(reader.GetOrdinal("rating")) ? 5.0m : reader.GetDecimal(reader.GetOrdinal("rating")),
                    RatingCount = reader.IsDBNull(reader.GetOrdinal("rating_count")) ? 0 : reader.GetInt32(reader.GetOrdinal("rating_count")),
                    Phone = reader.IsDBNull(reader.GetOrdinal("phone_number")) ? null : reader.GetString(reader.GetOrdinal("phone_number")),
                    Gender = reader.IsDBNull(reader.GetOrdinal("gender")) ? null : reader.GetString(reader.GetOrdinal("gender")),
                    FirstName = reader.IsDBNull(reader.GetOrdinal("first_name")) ? null : reader.GetString(reader.GetOrdinal("first_name")),
                    LastName = reader.IsDBNull(reader.GetOrdinal("last_name")) ? null : reader.GetString(reader.GetOrdinal("last_name")),
                    Email = reader.IsDBNull(reader.GetOrdinal("email")) ? null : reader.GetString(reader.GetOrdinal("email")),
                    CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at"))
                });
            }
            return list;
        }

        public async Task<bool> InsertRiderAsync(RiderDb r)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.InsertRider, conn);
            cmd.Parameters.AddWithValue("@Id", r.Id);
            cmd.Parameters.AddWithValue("@VehicleType", (object?)r.VehicleType ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@VehicleNumber", r.VehicleNumber);
            cmd.Parameters.AddWithValue("@LicenseNumber", r.LicenseNumber);
            cmd.Parameters.AddWithValue("@IsActive", r.IsActive);
            cmd.Parameters.AddWithValue("@DeliveryZone", (object?)r.DeliveryZone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@RcNumber", (object?)r.RcNumber ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@BankName", (object?)r.BankName ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@AccountNumber", (object?)r.AccountNumber ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IfscCode", (object?)r.IfscCode ?? DBNull.Value);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> UpdateRiderProfileAsync(RiderDb r)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var tx = await conn.BeginTransactionAsync();
            try
            {
                // 1. Update delivery_partners
                using var cmd1 = new NpgsqlCommand(@"
                    UPDATE delivery_partners
                    SET vehicle_type = @VehicleType, vehicle_number = @VehicleNumber, license_number = @LicenseNumber, delivery_zone = @DeliveryZone,
                        rc_number = @RcNumber, bank_name = @BankName, account_number = @AccountNumber, ifsc_code = @IfscCode
                    WHERE id = @Id;
                ", conn, tx);
                cmd1.Parameters.AddWithValue("@Id", r.Id);
                cmd1.Parameters.AddWithValue("@VehicleType", (object?)r.VehicleType ?? DBNull.Value);
                cmd1.Parameters.AddWithValue("@VehicleNumber", r.VehicleNumber);
                cmd1.Parameters.AddWithValue("@LicenseNumber", r.LicenseNumber);
                cmd1.Parameters.AddWithValue("@DeliveryZone", (object?)r.DeliveryZone ?? DBNull.Value);
                cmd1.Parameters.AddWithValue("@RcNumber", (object?)r.RcNumber ?? DBNull.Value);
                cmd1.Parameters.AddWithValue("@BankName", (object?)r.BankName ?? DBNull.Value);
                cmd1.Parameters.AddWithValue("@AccountNumber", (object?)r.AccountNumber ?? DBNull.Value);
                cmd1.Parameters.AddWithValue("@IfscCode", (object?)r.IfscCode ?? DBNull.Value);
                await cmd1.ExecuteNonQueryAsync();

                // 2. Update user_register details: phone_number, gender
                using var cmd2 = new NpgsqlCommand(@"
                    UPDATE user_register
                    SET phone_number = @Phone, gender = @Gender
                    WHERE id = @Id;
                ", conn, tx);
                cmd2.Parameters.AddWithValue("@Id", r.Id);
                cmd2.Parameters.AddWithValue("@Phone", (object?)r.Phone ?? DBNull.Value);
                cmd2.Parameters.AddWithValue("@Gender", (object?)r.Gender ?? DBNull.Value);
                await cmd2.ExecuteNonQueryAsync();

                await tx.CommitAsync();
                return true;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> UpdateRiderRatingAsync(string riderId, int rating)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(@"
                UPDATE delivery_partners
                SET rating = ((rating * rating_count) + @Rating) / (rating_count + 1),
                    rating_count = rating_count + 1
                WHERE id = @Id;
            ", conn);
            cmd.Parameters.AddWithValue("@Id", riderId);
            cmd.Parameters.AddWithValue("@Rating", (decimal)rating);
            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> UpdateRiderLocationAsync(string id, decimal latitude, decimal longitude)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.UpdateRiderLocation, conn);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@Latitude", latitude);
            cmd.Parameters.AddWithValue("@Longitude", longitude);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> UpdateRiderStatusAsync(string id, bool isActive)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.UpdateRiderStatus, conn);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@IsActive", isActive);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }
    }
}
