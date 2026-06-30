using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CloudeKicten.Models;
using CloudeKicten.Models.BusinessLayer;

namespace CloudeKicten.Controllers
{
    [ApiController]
    [Route("api/kitchens")]
    public class KitchenController : ControllerBase
    {
        private readonly IBusinessLayer_KitchenController _businessLayer;

        public KitchenController(IBusinessLayer_KitchenController businessLayer)
        {
            _businessLayer = businessLayer;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _businessLayer.GetAllKitchensAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var result = await _businessLayer.GetKitchenByIdAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] KitchenCreateDto dto)
        {
            var result = await _businessLayer.CreateKitchenAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] KitchenUpdateDto dto)
        {
            var result = await _businessLayer.UpdateKitchenAsync(id, dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _businessLayer.DeleteKitchenAsync(id);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
