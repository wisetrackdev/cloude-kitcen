using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CloudeKicten.Models;
using CloudeKicten.Models.DatabaseLayer;
using CloudeKicten.Models.BusinessLayer;

namespace CloudeKicten.Controllers
{
    [ApiController]
    [Route("api/wallet")]
    public class WalletController : ControllerBase
    {
        private readonly IBusinessLayer_WalletController _businessLayer;

        public WalletController(IBusinessLayer_WalletController businessLayer)
        {
            _businessLayer = businessLayer;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetWallet(string userId)
        {
            var result = await _businessLayer.GetWalletAsync(userId);
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        [HttpPost("{userId}/credit")]
        public async Task<IActionResult> Credit(string userId, [FromBody] WalletActionDto dto)
        {
            var result = await _businessLayer.CreditWalletAsync(userId, dto.Amount, dto.Description);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("{userId}/debit")]
        public async Task<IActionResult> Debit(string userId, [FromBody] WalletActionDto dto)
        {
            var result = await _businessLayer.DebitWalletAsync(userId, dto.Amount, dto.Description);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("{userId}/transactions")]
        public async Task<IActionResult> GetTransactions(string userId)
        {
            var result = await _businessLayer.GetTransactionHistoryAsync(userId);
            return Ok(result);
        }

        [HttpPost("payments")]
        public async Task<IActionResult> ProcessPayment([FromBody] PaymentRequestDto dto)
        {
            var result = await _businessLayer.ProcessPaymentAsync(dto.OrderId, dto.SubscriptionId, dto.Amount, dto.PaymentMethod, dto.TransactionId, dto.Status);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }
    }

    public class WalletActionDto
    {
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class PaymentRequestDto
    {
        public string? OrderId { get; set; }
        public string? SubscriptionId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "razorpay";
        public string TransactionId { get; set; } = string.Empty;
        public string Status { get; set; } = "success";
    }
}
