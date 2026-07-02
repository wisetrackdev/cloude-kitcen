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

            cmd.CommandText = Sql.CreateOrderChatsTable;
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

            try
            {
                await SeedMockStoresAsync(cmd);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DB SEED ERROR] Failed to seed mock stores: {ex.Message}");
            }
        }

        private async Task SeedMockStoresAsync(NpgsqlCommand cmd)
        {
            for (int i = 1; i <= 10; i++)
            {
                string userId = $"usr-seller-seed-{i}";
                string email = $"store{i}@gmail.com";
                string shopId = $"shp-seed-{i}";
                string shopName = i switch {
                    1 => "Burger King",
                    2 => "Pizza Hut",
                    3 => "KFC Express",
                    4 => "Starbucks Coffee",
                    5 => "McDonald's Homestyle",
                    6 => "Subway Fresh",
                    7 => "Haldiram Sweets",
                    8 => "Wendy's Burgers",
                    9 => "Chaayos Chai",
                    _ => "Rumali By Enoki"
                };
                string cuisines = i switch {
                    1 => "Burgers, Fast Food",
                    2 => "Pizzas, Italian",
                    3 => "Fried Chicken, Fast Food",
                    4 => "Coffee, Desserts",
                    5 => "Burgers, Fast Food",
                    6 => "Sandwiches, Salads",
                    7 => "Sweets, Indian",
                    8 => "Burgers, Fast Food",
                    9 => "Chai, Snacks",
                    _ => "Rolls, High Protein"
                };
                string logoUrl = i switch {
                    1 => "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=150",
                    2 => "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150",
                    3 => "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=150",
                    4 => "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=150",
                    5 => "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=150",
                    6 => "https://images.unsplash.com/photo-1598182126876-04cbe4859a2a?w=150",
                    7 => "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=150",
                    8 => "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150",
                    9 => "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=150",
                    _ => "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=150"
                };

                cmd.CommandText = "SELECT COUNT(*) FROM user_register WHERE email = @Email;";
                cmd.Parameters.Clear();
                cmd.Parameters.AddWithValue("@Email", email);
                long count = (long)(await cmd.ExecuteScalarAsync() ?? 0L);
                if (count == 0)
                {
                    cmd.CommandText = @"
                        INSERT INTO user_register (id, email, first_name, last_name, phone_number, role, is_verified, created_at)
                        VALUES (@Id, @Email, @First, @Last, @Phone, 'seller', TRUE, CURRENT_TIMESTAMP);";
                    cmd.Parameters.Clear();
                    cmd.Parameters.AddWithValue("@Id", userId);
                    cmd.Parameters.AddWithValue("@Email", email);
                    cmd.Parameters.AddWithValue("@First", shopName.Split(' ')[0]);
                    cmd.Parameters.AddWithValue("@Last", "Partner");
                    cmd.Parameters.AddWithValue("@Phone", $"+91 99999000" + i.ToString("D2"));
                    await cmd.ExecuteNonQueryAsync();

                    cmd.CommandText = @"
                        INSERT INTO shops (id, vendor_id, name, type, cuisines, rating, rating_count, prep_time, distance, offer, image_url, is_live, is_approved, address, cover_image_url)
                        VALUES (@ShpId, @Id, @Name, 'restaurant', @Cuisines, 4.2, 12, '30-40 mins', '2.5 km', 'Flat 50% OFF', @Logo, TRUE, 'approved', @Address, @Logo);";
                    cmd.Parameters.Clear();
                    cmd.Parameters.AddWithValue("@ShpId", shopId);
                    cmd.Parameters.AddWithValue("@Id", userId);
                    cmd.Parameters.AddWithValue("@Name", shopName);
                    cmd.Parameters.AddWithValue("@Cuisines", cuisines);
                    cmd.Parameters.AddWithValue("@Logo", logoUrl);
                    cmd.Parameters.AddWithValue("@Address", $"Sector " + (10 + i).ToString() + ", Noida, Uttar Pradesh");
                    await cmd.ExecuteNonQueryAsync();

                    for (int p = 1; p <= 3; p++)
                    {
                        cmd.CommandText = @"
                            INSERT INTO products (id, kitchen_id, name, price, description, category_name, is_veg, image_url)
                            VALUES (@ProdId, @ShpId, @ProdName, @Price, @Desc, @CatName, TRUE, @Logo);";
                        cmd.Parameters.Clear();
                        cmd.Parameters.AddWithValue("@ProdId", $"prd-seed-{i}-{p}");
                        cmd.Parameters.AddWithValue("@ShpId", shopId);
                        cmd.Parameters.AddWithValue("@ProdName", $"{shopName} Special Dish {p}");
                        cmd.Parameters.AddWithValue("@Price", 99m + (p * 50m));
                        cmd.Parameters.AddWithValue("@Desc", $"Delicious freshly prepared signature dish {p} from {shopName}");
                        cmd.Parameters.AddWithValue("@CatName", p == 1 ? "Meals" : (p == 2 ? "Biryani" : "Burgers"));
                        cmd.Parameters.AddWithValue("@Logo", logoUrl);
                        await cmd.ExecuteNonQueryAsync();
                    }
                }
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
                IsVerified = r.IsDBNull(r.GetOrdinal("is_verified")) ? false : r.GetBoolean(r.GetOrdinal("is_verified")),
                CreatedAt = r.GetDateTime(r.GetOrdinal("created_at"))
            };
        }
    }
}
