using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace CloudeKicten.Models.DatabaseLayer
{
    public interface IDatabaseLayer_NotificationController
    {
        Task<List<NotificationDb>> GetNotificationsByUserIdAsync(string userId);
        Task<bool> InsertNotificationAsync(NotificationDb notification);
        Task<bool> MarkNotificationsAsReadAsync(string userId);
    }

    public class DatabaseLayer_NotificationController : IDatabaseLayer_NotificationController
    {
        private readonly IConfiguration _configuration;
        private readonly string DbConnection;

        public DatabaseLayer_NotificationController(IConfiguration configuration)
        {
            this._configuration = configuration;
            this.DbConnection = this._configuration.GetConnectionString("AppDbContext") 
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found.");
        }

        private NpgsqlConnection GetConnection() => new NpgsqlConnection(DbConnection);

        public async Task<List<NotificationDb>> GetNotificationsByUserIdAsync(string userId)
        {
            var list = new List<NotificationDb>();
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.GetNotificationsByUserId, conn);
            cmd.Parameters.AddWithValue("@UserId", userId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new NotificationDb
                {
                    Id = reader.GetString(reader.GetOrdinal("id")),
                    UserId = reader.GetString(reader.GetOrdinal("user_id")),
                    Title = reader.GetString(reader.GetOrdinal("title")),
                    Body = reader.GetString(reader.GetOrdinal("body")),
                    IsRead = reader.GetBoolean(reader.GetOrdinal("is_read")),
                    CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at"))
                });
            }
            return list;
        }

        public async Task<bool> InsertNotificationAsync(NotificationDb n)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.InsertNotification, conn);
            cmd.Parameters.AddWithValue("@Id", n.Id);
            cmd.Parameters.AddWithValue("@UserId", n.UserId);
            cmd.Parameters.AddWithValue("@Title", n.Title);
            cmd.Parameters.AddWithValue("@Body", n.Body);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }

        public async Task<bool> MarkNotificationsAsReadAsync(string userId)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(Sql.UpdateNotificationReadStatus, conn);
            cmd.Parameters.AddWithValue("@UserId", userId);

            var result = await cmd.ExecuteNonQueryAsync();
            return result > 0;
        }
    }

    public class NotificationDb
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
