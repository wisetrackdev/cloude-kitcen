using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CloudeKicten.Models;
using CloudeKicten.Models.BusinessLayer;

namespace CloudeKicten.Controllers
{
    [ApiController]
    [Route("api/subscriptions")]
    public class SubscriptionController : ControllerBase
    {
        private readonly IBusinessLayer_SubscriptionController _businessLayer;

        public SubscriptionController(IBusinessLayer_SubscriptionController businessLayer)
        {
            _businessLayer = businessLayer;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? customerId, [FromQuery] string? kitchenId)
        {
            if (!string.IsNullOrEmpty(customerId))
            {
                var userSubs = await _businessLayer.GetSubscriptionsByCustomerIdAsync(customerId);
                return Ok(userSubs);
            }
            if (!string.IsNullOrEmpty(kitchenId))
            {
                var kitchenSubs = await _businessLayer.GetSubscriptionsByKitchenIdAsync(kitchenId);
                return Ok(kitchenSubs);
            }

            var allSubs = await _businessLayer.GetAllSubscriptionsAsync();
            return Ok(allSubs);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var result = await _businessLayer.GetSubscriptionByIdAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SubscriptionCreateDto dto)
        {
            var result = await _businessLayer.CreateSubscriptionAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] SubscriptionStatusUpdateDto dto)
        {
            var result = await _businessLayer.UpdateSubscriptionStatusAsync(id, dto.Status);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
