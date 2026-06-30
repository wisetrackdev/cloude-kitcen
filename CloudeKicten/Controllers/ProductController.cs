using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CloudeKicten.Models;
using CloudeKicten.Models.BusinessLayer;

namespace CloudeKicten.Controllers
{
    [ApiController]
    [Route("api/products")]
    public class ProductController : ControllerBase
    {
        private readonly IBusinessLayer_ProductController _businessLayer;

        public ProductController(IBusinessLayer_ProductController businessLayer)
        {
            _businessLayer = businessLayer;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? kitchenId)
        {
            if (!string.IsNullOrEmpty(kitchenId))
            {
                var resultByKitchen = await _businessLayer.GetProductsByKitchenIdAsync(kitchenId);
                return Ok(resultByKitchen);
            }

            var result = await _businessLayer.GetAllProductsAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var result = await _businessLayer.GetProductByIdAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            var result = await _businessLayer.CreateProductAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] ProductUpdateDto dto)
        {
            var result = await _businessLayer.UpdateProductAsync(id, dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _businessLayer.DeleteProductAsync(id);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
