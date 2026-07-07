using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CloudeKicten.Models;
using CloudeKicten.Models.DatabaseLayer;
using CloudeKicten.Models.BusinessLayer;

namespace CloudeKicten.Controllers
{
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly IBusinessLayer_AdminController _businessLayer;

        public AdminController(IBusinessLayer_AdminController businessLayer)
        {
            _businessLayer = businessLayer;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats([FromQuery] string adminUserId)
        {
            var result = await _businessLayer.GetDashboardStatsAsync(adminUserId);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("vendors/pending")]
        public async Task<IActionResult> GetPendingVendors([FromQuery] string adminUserId)
        {
            var result = await _businessLayer.GetPendingVendorsAsync(adminUserId);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPut("vendors/{vendorId}/approve")]
        public async Task<IActionResult> ApproveVendor(string vendorId, [FromQuery] string adminUserId, [FromQuery] string status)
        {
            var result = await _businessLayer.ApproveVendorAsync(adminUserId, vendorId, status);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPut("riders/{riderId}/approve")]
        public async Task<IActionResult> ApproveRider(string riderId, [FromQuery] string adminUserId, [FromQuery] bool isApproved)
        {
            var result = await _businessLayer.ApproveRiderAsync(adminUserId, riderId, isApproved);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("settlements")]
        public async Task<IActionResult> GetSettlements([FromQuery] string adminUserId)
        {
            var result = await _businessLayer.GetAllSettlementsAsync(adminUserId);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("settlements")]
        public async Task<IActionResult> RequestSettlement([FromQuery] string adminUserId, [FromBody] SettlementDb settlement)
        {
            var result = await _businessLayer.CreateSettlementAsync(adminUserId, settlement);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPut("settlements/{settlementId}/status")]
        public async Task<IActionResult> UpdateSettlementStatus(string settlementId, [FromQuery] string adminUserId, [FromBody] SettlementUpdateDto dto)
        {
            var result = await _businessLayer.UpdateSettlementStatusAsync(adminUserId, settlementId, dto.Status, dto.TransactionDetails);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("banners")]
        public async Task<IActionResult> GetBanners()
        {
            var result = await _businessLayer.GetActiveBannersAsync();
            return Ok(result);
        }

        [HttpPost("banners")]
        public async Task<IActionResult> CreateBanner([FromQuery] string adminUserId, [FromBody] BannerDb banner)
        {
            var result = await _businessLayer.UploadBannerAsync(adminUserId, banner);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("truncate")]
        public async Task<IActionResult> TruncateDatabase([FromQuery] string adminUserId)
        {
            var result = await _businessLayer.TruncateAllTablesAsync(adminUserId);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }
    }

    public class SettlementUpdateDto
    {
        public string Status { get; set; } = "settled";
        public string TransactionDetails { get; set; } = string.Empty;
    }
}
