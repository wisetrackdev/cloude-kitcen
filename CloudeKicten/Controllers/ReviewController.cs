using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CloudeKicten.Models;
using CloudeKicten.Models.DatabaseLayer;
using CloudeKicten.Models.BusinessLayer;

namespace CloudeKicten.Controllers
{
    [ApiController]
    [Route("api/reviews")]
    public class ReviewController : ControllerBase
    {
        private readonly IBusinessLayer_ReviewController _businessLayer;

        public ReviewController(IBusinessLayer_ReviewController businessLayer)
        {
            _businessLayer = businessLayer;
        }

        [HttpGet("kitchen/{kitchenId}")]
        public async Task<IActionResult> GetByKitchen(string kitchenId)
        {
            var result = await _businessLayer.GetReviewsByKitchenIdAsync(kitchenId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Submit([FromBody] ReviewDb review)
        {
            var result = await _businessLayer.SubmitReviewAsync(review);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }
    }
}
