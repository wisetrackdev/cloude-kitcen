using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CloudeKicten.Models.DatabaseLayer;

namespace CloudeKicten.Models.BusinessLayer
{
    public interface IBusinessLayer_NotificationController
    {
        Task<ApiResponse<List<NotificationDb>>> GetNotificationsAsync(string userId);
        Task<ApiResponse<NotificationDb>> SendNotificationAsync(string userId, string title, string body);
        Task<ApiResponse<bool>> MarkAsReadAsync(string userId);
    }

    public class BusinessLayer_NotificationController : IBusinessLayer_NotificationController
    {
        private readonly IDatabaseLayer_NotificationController _databaseLayer;

        public BusinessLayer_NotificationController(IDatabaseLayer_NotificationController databaseLayer)
        {
            this._databaseLayer = databaseLayer;
        }

        public async Task<ApiResponse<List<NotificationDb>>> GetNotificationsAsync(string userId)
        {
            var list = await _databaseLayer.GetNotificationsByUserIdAsync(userId);
            return ApiResponse<List<NotificationDb>>.Ok(list);
        }

        public async Task<ApiResponse<NotificationDb>> SendNotificationAsync(string userId, string title, string body)
        {
            var notif = new NotificationDb
            {
                Id = "NTF-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper(),
                UserId = userId,
                Title = title,
                Body = body,
                IsRead = false
            };

            var success = await _databaseLayer.InsertNotificationAsync(notif);
            if (!success) return ApiResponse<NotificationDb>.Fail("Failed to dispatch notification.");

            // In a production-ready system, here you would also integrate Firebase Cloud Messaging (FCM) 
            // for instant real-time Android/iOS push notifications.
            
            return ApiResponse<NotificationDb>.Ok(notif, "Notification logged and sent successfully.");
        }

        public async Task<ApiResponse<bool>> MarkAsReadAsync(string userId)
        {
            var success = await _databaseLayer.MarkNotificationsAsReadAsync(userId);
            return ApiResponse<bool>.Ok(success, "Notifications marked as read.");
        }
    }
}
