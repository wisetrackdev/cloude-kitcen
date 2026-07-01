using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CloudeKicten.Models;
using CloudeKicten.Models.BusinessLayer;

namespace CloudeKicten.Controllers
{
    [ApiController]
    [Route("api/riders")]
    public class RiderController : ControllerBase
    {
        private readonly IBusinessLayer_RiderController _businessLayer;

        public RiderController(IBusinessLayer_RiderController businessLayer)
        {
            _businessLayer = businessLayer;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllRiders()
        {
            var result = await _businessLayer.GetAllRidersAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProfile(string id)
        {
            var result = await _businessLayer.GetRiderProfileAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterRider([FromBody] RiderRegisterDto dto)
        {
            var result = await _businessLayer.RegisterRiderAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPut("{id}/profile")]
        public async Task<IActionResult> UpdateProfile(string id, [FromBody] RiderProfileUpdateDto dto)
        {
            var result = await _businessLayer.UpdateRiderProfileAsync(id, dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("{id}/rate")]
        public async Task<IActionResult> RateRider(string id, [FromBody] RateRiderDto dto)
        {
            var result = await _businessLayer.RateRiderAsync(id, dto.Rating);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPut("{id}/location")]
        public async Task<IActionResult> UpdateLocation(string id, [FromBody] RiderLocationUpdateDto dto)
        {
            var result = await _businessLayer.UpdateLocationAsync(id, dto.Latitude, dto.Longitude);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] RiderStatusUpdateDto dto)
        {
            var result = await _businessLayer.UpdateStatusAsync(id, dto.IsActive);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
