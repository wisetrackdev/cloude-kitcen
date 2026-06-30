using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CloudeKicten.Models;
using CloudeKicten.Models.DatabaseLayer;
using CloudeKicten.Models.BusinessLayer;

namespace CloudeKicten.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationController : ControllerBase
    {
        private readonly IBusinessLayer_NotificationController _businessLayer;

        public NotificationController(IBusinessLayer_NotificationController businessLayer)
        {
            _businessLayer = businessLayer;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserNotifications(string userId)
        {
            var result = await _businessLayer.GetNotificationsAsync(userId);
            return Ok(result);
        }

        [HttpPost("send")]
        public async Task<IActionResult> DispatchNotification([FromBody] SendNotificationDto dto)
        {
            var result = await _businessLayer.SendNotificationAsync(dto.UserId, dto.Title, dto.Body);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPut("{userId}/read")]
        public async Task<IActionResult> MarkAsRead(string userId)
        {
            var result = await _businessLayer.MarkAsReadAsync(userId);
            return Ok(result);
        }
    }

    public class SendNotificationDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
    }
}
