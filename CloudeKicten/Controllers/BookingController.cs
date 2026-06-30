using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CloudeKicten.Models;
using CloudeKicten.Models.BusinessLayer;

namespace CloudeKicten.Controllers
{
    [ApiController]
    [Route("api/bookings")]
    public class BookingController : ControllerBase
    {
        private readonly IBusinessLayer_BookingController _businessLayer;

        public BookingController(IBusinessLayer_BookingController businessLayer)
        {
            _businessLayer = businessLayer;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? customerId, [FromQuery] string? kitchenId)
        {
            if (!string.IsNullOrEmpty(customerId))
            {
                var userBookings = await _businessLayer.GetBookingsByCustomerIdAsync(customerId);
                return Ok(userBookings);
            }
            if (!string.IsNullOrEmpty(kitchenId))
            {
                var kitchenBookings = await _businessLayer.GetBookingsByKitchenIdAsync(kitchenId);
                return Ok(kitchenBookings);
            }

            var allBookings = await _businessLayer.GetAllBookingsAsync();
            return Ok(allBookings);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var result = await _businessLayer.GetBookingByIdAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BookingCreateDto dto)
        {
            var result = await _businessLayer.CreateBookingAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] BookingStatusUpdateDto dto)
        {
            var result = await _businessLayer.UpdateBookingStatusAsync(id, dto.Status);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
