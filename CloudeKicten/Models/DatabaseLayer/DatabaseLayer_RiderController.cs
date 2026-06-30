using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace CloudeKicten.Models.DatabaseLayer
{
    public interface IDatabaseLayer_RiderController
    {
        Task<RiderDb?> GetRiderByIdAsync(string id);
        Task<bool> InsertRiderAsync(RiderDb rider);
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
                    VehicleNumber = reader.GetString(reader.GetOrdinal("vehicle_number")),
                    LicenseNumber = reader.GetString(reader.GetOrdinal("license_number")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("is_active")),
                    CurrentLatitude = reader.IsDBNull(reader.GetOrdinal("current_latitude")) ? null : reader.GetDecimal(reader.GetOrdinal("current_latitude")),
                    CurrentLongitude = reader.IsDBNull(reader.GetOrdinal("current_longitude")) ? null : reader.GetDecimal(reader.GetOrdinal("current_longitude")),
                    CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at"))
                };
            }
            return null;
        }

        public async Task<bool> InsertRiderAsync(RiderDb r)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.InsertRider, conn);
            cmd.Parameters.AddWithValue("@Id", r.Id);
            cmd.Parameters.AddWithValue("@VehicleNumber", r.VehicleNumber);
            cmd.Parameters.AddWithValue("@LicenseNumber", r.LicenseNumber);
            cmd.Parameters.AddWithValue("@IsActive", r.IsActive);

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
