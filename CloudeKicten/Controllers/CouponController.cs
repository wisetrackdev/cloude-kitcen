using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CloudeKicten.Models;
using CloudeKicten.Models.DatabaseLayer;
using CloudeKicten.Models.BusinessLayer;

namespace CloudeKicten.Controllers
{
    [ApiController]
    [Route("api/coupons")]
    public class CouponController : ControllerBase
    {
        private readonly IBusinessLayer_CouponController _businessLayer;

        public CouponController(IBusinessLayer_CouponController businessLayer)
        {
            _businessLayer = businessLayer;
        }

        [HttpGet]
        public async Task<IActionResult> GetActive([FromQuery] string? kitchenId = null)
        {
            var result = await _businessLayer.GetActiveCouponsAsync(kitchenId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CouponDb coupon)
        {
            var result = await _businessLayer.CreateCouponAsync(coupon);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("apply")]
        public async Task<IActionResult> Apply([FromQuery] string code, [FromQuery] decimal orderTotal)
        {
            var result = await _businessLayer.ApplyCouponAsync(code, orderTotal);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }
    }
}
