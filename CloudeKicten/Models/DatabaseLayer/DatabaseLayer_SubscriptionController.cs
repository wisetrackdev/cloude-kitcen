using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace CloudeKicten.Models.DatabaseLayer
{
    public interface IDatabaseLayer_SubscriptionController
    {
        Task<List<SubscriptionDb>> GetAllSubscriptionsAsync();
        Task<List<SubscriptionDb>> GetSubscriptionsByCustomerIdAsync(string customerId);
        Task<List<SubscriptionDb>> GetSubscriptionsByKitchenIdAsync(string kitchenId);
        Task<SubscriptionDb?> GetSubscriptionByIdAsync(string id);
        Task<bool> InsertSubscriptionAsync(SubscriptionDb subscription);
        Task<bool> UpdateSubscriptionStatusAsync(string id, string status);
    }

    public class DatabaseLayer_SubscriptionController : IDatabaseLayer_SubscriptionController
    {
        private readonly IConfiguration _configuration;
        private readonly string DbConnection;

        public DatabaseLayer_SubscriptionController(IConfiguration configuration)
        {
            this._configuration = configuration;
            this.DbConnection = this._configuration.GetConnectionString("AppDbContext") 
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found.");
        }

        private NpgsqlConnection GetConnection() => new NpgsqlConnection(DbConnection);

        public async Task<List<SubscriptionDb>> GetAllSubscriptionsAsync()
        {
            var list = new List<SubscriptionDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetAllSubscriptions, conn);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(MapSubscription(reader));
            }
            return list;
        }

        public async Task<List<SubscriptionDb>> GetSubscriptionsByCustomerIdAsync(string customerId)
        {
            var list = new List<SubscriptionDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetSubscriptionsByCustomerId, conn);
            cmd.Parameters.AddWithValue("@CustomerId", customerId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(MapSubscription(reader));
            }
            return list;
        }

        public async Task<List<SubscriptionDb>> GetSubscriptionsByKitchenIdAsync(string kitchenId)
        {
            var list = new List<SubscriptionDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetSubscriptionsByKitchenId, conn);
            cmd.Parameters.AddWithValue("@KitchenId", kitchenId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(MapSubscription(reader));
            }
            return list;
        }

        public async Task<SubscriptionDb?> GetSubscriptionByIdAsync(string id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetSubscriptionById, conn);
            cmd.Parameters.AddWithValue("@Id", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapSubscription(reader);
            }
            return null;
        }

        public async Task<bool> InsertSubscriptionAsync(SubscriptionDb s)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.InsertSubscription, conn);
            cmd.Parameters.AddWithValue("@Id", s.Id);
            cmd.Parameters.AddWithValue("@CustomerId", s.CustomerId);
            cmd.Parameters.AddWithValue("@KitchenId", s.KitchenId);
            cmd.Parameters.AddWithValue("@PlanName", s.PlanName);
            cmd.Parameters.AddWithValue("@Frequency", s.Frequency);
            cmd.Parameters.AddWithValue("@DurationDays", s.DurationDays);
            cmd.Parameters.AddWithValue("@MealsSelected", s.MealsSelected);
            cmd.Parameters.AddWithValue("@StartDate", s.StartDate);
            cmd.Parameters.AddWithValue("@EndDate", s.EndDate);
            cmd.Parameters.AddWithValue("@Price", s.Price);
            cmd.Parameters.AddWithValue("@PaidAmount", s.PaidAmount);
            cmd.Parameters.AddWithValue("@PaymentStatus", s.PaymentStatus);
            cmd.Parameters.AddWithValue("@Status", s.Status);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> UpdateSubscriptionStatusAsync(string id, string status)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.UpdateSubscriptionStatus, conn);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@Status", status);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        private static SubscriptionDb MapSubscription(NpgsqlDataReader r)
        {
            return new SubscriptionDb
            {
                Id = r.GetString(r.GetOrdinal("id")),
                CustomerId = r.GetString(r.GetOrdinal("customer_id")),
                KitchenId = r.GetString(r.GetOrdinal("kitchen_id")),
                PlanName = r.GetString(r.GetOrdinal("plan_name")),
                Frequency = r.GetInt32(r.GetOrdinal("frequency")),
                DurationDays = r.GetInt32(r.GetOrdinal("duration_days")),
                MealsSelected = r.GetString(r.GetOrdinal("meals_selected")),
                StartDate = r.GetDateTime(r.GetOrdinal("start_date")),
                EndDate = r.GetDateTime(r.GetOrdinal("end_date")),
                Price = r.GetDecimal(r.GetOrdinal("price")),
                PaidAmount = r.GetDecimal(r.GetOrdinal("paid_amount")),
                PaymentStatus = r.GetString(r.GetOrdinal("payment_status")),
                Status = r.GetString(r.GetOrdinal("status")),
                CreatedAt = r.GetDateTime(r.GetOrdinal("created_at"))
            };
        }
    }
}
