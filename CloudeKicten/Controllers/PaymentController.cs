using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using CloudeKicten.Models;
using CloudeKicten.Models.BusinessLayer;

namespace CloudeKicten.Controllers
{
    [ApiController]
    [Route("api/payment")]
    public class PaymentController : ControllerBase
    {
        private readonly IBusinessLayer_PaymentController _paymentService;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(IBusinessLayer_PaymentController paymentService, ILogger<PaymentController> logger)
        {
            _paymentService = paymentService;
            _logger = logger;
        }

        [HttpPost("verify")]
        public async Task<IActionResult> VerifyPayment([FromBody] PaymentVerifyRequestDto dto)
        {
            _logger.LogInformation("HTTP POST api/payment/verify called.");

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for verify request.");
                return BadRequest(ApiResponse<PaymentVerifyResponseDto>.Fail("Validation failed. Please check inputs."));
            }

            try
            {
                var result = await _paymentService.VerifyPaymentAsync(dto);
                if (!result.Success)
                {
                    _logger.LogWarning("Payment verification failed: {Msg}", result.Message);
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in PaymentController.VerifyPayment");
                return StatusCode(500, ApiResponse<PaymentVerifyResponseDto>.Fail($"Internal Server Error: {ex.Message}"));
            }
        }
    }
}
