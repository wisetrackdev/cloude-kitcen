using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace CloudeKicten.Models.DatabaseLayer
{
    public interface IDatabaseLayer_AuthController
    {
        Task InitializeDatabaseAsync();
        Task<UserDb?> GetUserByEmailAsync(string email);
        Task<UserDb?> GetUserByIdAsync(string id);
        Task<bool> UpsertUserAsync(UserDb user);
        Task<bool> UpdateUserOtpAsync(string email, string otp, DateTime expiry);
        Task<bool> ClearUserOtpAsync(string email);
        Task<bool> UpdateUserProfileAsync(UserDb user);
    }

    public class DatabaseLayer_AuthController : IDatabaseLayer_AuthController
    {
        private readonly IConfiguration _configuration;
        private readonly string DbConnection;

        public DatabaseLayer_AuthController(IConfiguration configuration)
        {
            this._configuration = configuration;
            this.DbConnection = this._configuration.GetConnectionString("AppDbContext") 
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found.");
        }

        private NpgsqlConnection GetConnection() => new NpgsqlConnection(DbConnection);

        public async Task InitializeDatabaseAsync()
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = conn.CreateCommand();
            
            // Execute table creations in order of dependencies (respecting FK constraints)
            cmd.CommandText = Sql.CreateUsersTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateRolesTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateUserRolesTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateVendorsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateVendorDocumentsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateShopsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateCategoriesTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateProductsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateProductImagesTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateProductVariantsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateCustomersTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateDeliveryPartnersTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateOrdersTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateOrderItemsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateOrderStatusHistoryTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateMonthlySubscriptionsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateSubscriptionMealsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreatePaymentsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateWalletsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateWalletTransactionsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateCouponsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateReviewsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateNotificationsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateAddressesTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateBannersTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateSettlementsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateAppSettingsTable;
            await cmd.ExecuteNonQueryAsync();

            cmd.CommandText = Sql.CreateAuditLogsTable;
            await cmd.ExecuteNonQueryAsync();

            try
            {
                cmd.CommandText = Sql.AlterShopsTable;
                await cmd.ExecuteNonQueryAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DB MIGRATION WARNING] Failed to alter shops table: {ex.Message}");
            }
        }

        public async Task<UserDb?> GetUserByEmailAsync(string email)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetUserByEmail, conn);
            cmd.Parameters.AddWithValue("@Email", email.Trim().ToLower());

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapUser(reader);
            }
            return null;
        }

        public async Task<UserDb?> GetUserByIdAsync(string id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetUserById, conn);
            cmd.Parameters.AddWithValue("@Id", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapUser(reader);
            }
            return null;
        }

        public async Task<bool> UpsertUserAsync(UserDb user)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.InsertUser, conn);
            cmd.Parameters.AddWithValue("@Id", user.Id);
            cmd.Parameters.AddWithValue("@Email", user.Email.Trim().ToLower());
            cmd.Parameters.AddWithValue("@FirstName", user.FirstName);
            cmd.Parameters.AddWithValue("@LastName", user.LastName);
            cmd.Parameters.AddWithValue("@Phone", (object?)user.Phone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Avatar", (object?)user.Avatar ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Gender", (object?)user.Gender ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Role", user.Role);
            cmd.Parameters.AddWithValue("@RewardPoints", user.RewardPoints);
            cmd.Parameters.AddWithValue("@Otp", (object?)user.Otp ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@OtpExpiry", (object?)user.OtpExpiry ?? DBNull.Value);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> UpdateUserOtpAsync(string email, string otp, DateTime expiry)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.UpdateUserOtp, conn);
            cmd.Parameters.AddWithValue("@Email", email.Trim().ToLower());
            cmd.Parameters.AddWithValue("@Otp", otp);
            cmd.Parameters.AddWithValue("@OtpExpiry", expiry);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> ClearUserOtpAsync(string email)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.ClearUserOtp, conn);
            cmd.Parameters.AddWithValue("@Email", email.Trim().ToLower());

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> UpdateUserProfileAsync(UserDb user)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.UpdateUserProfile, conn);
            cmd.Parameters.AddWithValue("@Id", user.Id);
            cmd.Parameters.AddWithValue("@FirstName", user.FirstName);
            cmd.Parameters.AddWithValue("@LastName", user.LastName);
            cmd.Parameters.AddWithValue("@Phone", (object?)user.Phone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Avatar", (object?)user.Avatar ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Gender", (object?)user.Gender ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Role", user.Role);
            cmd.Parameters.AddWithValue("@RewardPoints", user.RewardPoints);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        private static UserDb MapUser(NpgsqlDataReader r)
        {
            return new UserDb
            {
                Id = r.GetString(r.GetOrdinal("id")),
                Email = r.GetString(r.GetOrdinal("email")),
                FirstName = r.GetString(r.GetOrdinal("first_name")),
                LastName = r.GetString(r.GetOrdinal("last_name")),
                Phone = r.IsDBNull(r.GetOrdinal("phone_number")) ? null : r.GetString(r.GetOrdinal("phone_number")),
                Avatar = r.IsDBNull(r.GetOrdinal("avatar")) ? null : r.GetString(r.GetOrdinal("avatar")),
                Gender = r.IsDBNull(r.GetOrdinal("gender")) ? null : r.GetString(r.GetOrdinal("gender")),
                Role = r.GetString(r.GetOrdinal("role")),
                RewardPoints = r.GetInt32(r.GetOrdinal("reward_points")),
                Otp = r.IsDBNull(r.GetOrdinal("otp")) ? null : r.GetString(r.GetOrdinal("otp")),
                OtpExpiry = r.IsDBNull(r.GetOrdinal("otp_expires_at")) ? null : r.GetDateTime(r.GetOrdinal("otp_expires_at")),
                CreatedAt = r.GetDateTime(r.GetOrdinal("created_at"))
            };
        }
    }
}
