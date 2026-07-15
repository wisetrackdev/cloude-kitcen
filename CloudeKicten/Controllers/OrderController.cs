using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CloudeKicten.Models;
using CloudeKicten.Models.BusinessLayer;

namespace CloudeKicten.Controllers
{
    [ApiController]
    [Route("api/orders")]
    public class OrderController : ControllerBase
    {
        private readonly IBusinessLayer_OrderController _businessLayer;

        public OrderController(IBusinessLayer_OrderController businessLayer)
        {
            _businessLayer = businessLayer;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? customerId, [FromQuery] string? kitchenId, [FromQuery] string? riderId)
        {
            if (!string.IsNullOrEmpty(customerId))
            {
                var customerOrders = await _businessLayer.GetOrdersByCustomerIdAsync(customerId);
                return Ok(customerOrders);
            }
            if (!string.IsNullOrEmpty(kitchenId))
            {
                var kitchenOrders = await _businessLayer.GetOrdersByKitchenIdAsync(kitchenId);
                return Ok(kitchenOrders);
            }
            if (!string.IsNullOrEmpty(riderId))
            {
                var riderOrders = await _businessLayer.GetOrdersByRiderIdAsync(riderId);
                return Ok(riderOrders);
            }

            var allOrders = await _businessLayer.GetAllOrdersAsync();
            return Ok(allOrders);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var result = await _businessLayer.GetOrderByIdAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] OrderCreateDto dto)
        {
            var result = await _businessLayer.CreateOrderAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] OrderStatusUpdateDto dto)
        {
            var result = await _businessLayer.UpdateOrderStatusAsync(id, dto.Status, dto.PickupPhotoUrl, dto.DeliveryPhotoUrl);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _businessLayer.DeleteOrderAsync(id);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("{id}/chats")]
        public async Task<IActionResult> GetChats(string id)
        {
            var result = await _businessLayer.GetChatsByOrderIdAsync(id);
            return Ok(result);
        }

        [HttpPost("{id}/chats")]
        public async Task<IActionResult> SendChat(string id, [FromBody] ChatCreateDto dto)
        {
            var result = await _businessLayer.SendChatMessageAsync(id, dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPut("{id}/accept")]
        public async Task<IActionResult> AcceptOrder(string id, [FromQuery] string riderId)
        {
            var result = await _businessLayer.AcceptOrderAsync(id, riderId);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("support/rooms")]
        public async Task<IActionResult> GetSupportRooms()
        {
            var result = await _businessLayer.GetSupportRoomsAsync();
            return Ok(result);
        }

        [HttpGet("address")]
        public async Task<IActionResult> GetAddresses([FromQuery] string userId)
        {
            var result = await _businessLayer.GetAddressesByUserIdAsync(userId);
            return Ok(result);
        }

        [HttpPost("address")]
        public async Task<IActionResult> SaveAddress([FromBody] AddressDto dto)
        {
            var result = await _businessLayer.SaveAddressAsync(dto);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("address/{id}")]
        public async Task<IActionResult> DeleteAddress(string id)
        {
            var result = await _businessLayer.DeleteAddressAsync(id);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("preview-delivery")]
        public async Task<IActionResult> PreviewDelivery([FromBody] DeliveryPreviewRequestDto dto)
        {
            var result = await _businessLayer.PreviewDeliveryAsync(dto);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("{id}/assign-rider")]
        public async Task<IActionResult> AssignNearestRider(string id)
        {
            var result = await _businessLayer.AssignNearestRiderAsync(id);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }
    }
}
