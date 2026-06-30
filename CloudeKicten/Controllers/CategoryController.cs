using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CloudeKicten.Models;
using CloudeKicten.Models.DatabaseLayer;
using CloudeKicten.Models.BusinessLayer;

namespace CloudeKicten.Controllers
{
    [ApiController]
    [Route("api/categories")]
    public class CategoryController : ControllerBase
    {
        private readonly IBusinessLayer_CategoryController _businessLayer;

        public CategoryController(IBusinessLayer_CategoryController businessLayer)
        {
            _businessLayer = businessLayer;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _businessLayer.GetAllCategoriesAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var result = await _businessLayer.GetCategoryByIdAsync(id);
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CategoryDb category)
        {
            var result = await _businessLayer.CreateCategoryAsync(category);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] CategoryDb category)
        {
            var result = await _businessLayer.UpdateCategoryAsync(id, category);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _businessLayer.DeleteCategoryAsync(id);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }
    }
}
