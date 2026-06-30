using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using CloudeKicten.Models;
using CloudeKicten.Models.BusinessLayer;

namespace CloudeKicten.Controllers
{
    [ApiController]
    [Route("api/upload")]
    public class UploadController : ControllerBase
    {
        private readonly IBusinessLayer_UploadController _businessLayer;

        public UploadController(IBusinessLayer_UploadController businessLayer)
        {
            _businessLayer = businessLayer;
        }

        [HttpPost]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(ApiResponse<string>.Fail("No file was uploaded."));
            }

            using var stream = file.OpenReadStream();
            var result = await _businessLayer.UploadFileAsync(stream, file.FileName);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
