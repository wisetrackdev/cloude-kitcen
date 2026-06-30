using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace CloudeKicten.Models.BusinessLayer
{
    public interface IBusinessLayer_UploadController
    {
        Task<ApiResponse<string>> UploadFileAsync(Stream fileStream, string fileName);
    }

    public class BusinessLayer_UploadController : IBusinessLayer_UploadController
    {
        private readonly IConfiguration _configuration;

        public BusinessLayer_UploadController(IConfiguration configuration)
        {
            this._configuration = configuration;
        }

        public async Task<ApiResponse<string>> UploadFileAsync(Stream fileStream, string fileName)
        {
            try
            {
                var cloudSection = _configuration.GetSection("CloudinarySettings");
                var account = new Account(
                    cloudSection["CloudName"],
                    cloudSection["ApiKey"],
                    cloudSection["ApiSecret"]
                );

                var cloudinary = new Cloudinary(account);

                var uploadParams = new ImageUploadParams()
                {
                    File = new FileDescription(fileName, fileStream),
                    Folder = "cloude_kitchen"
                };

                var uploadResult = await cloudinary.UploadAsync(uploadParams);
                if (uploadResult.Error != null)
                {
                    return ApiResponse<string>.Fail(uploadResult.Error.Message);
                }

                string secureUrl = uploadResult.SecureUrl.ToString();
                return ApiResponse<string>.Ok(secureUrl, "Image uploaded successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<string>.Fail($"Cloudinary upload failed: {ex.Message}");
            }
        }
    }
}
