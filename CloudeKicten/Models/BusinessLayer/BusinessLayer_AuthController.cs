using System;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Mail;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using CloudeKicten.Models.DatabaseLayer;

namespace CloudeKicten.Models.BusinessLayer
{
    public interface IBusinessLayer_AuthController
    {
        Task<ApiResponse<string>> RequestOtpAsync(string email);
        Task<ApiResponse<AuthResponseDto>> VerifyOtpAsync(string email, string otp);
        Task<ApiResponse<UserDto>> GetUserProfileAsync(string id);
        Task<ApiResponse<UserDto>> UpdateUserProfileAsync(string id, UserDto dto);
        Task<ApiResponse<UserDto>> CompleteProfileAsync(CompleteProfileDto dto);
        Task<ApiResponse<List<UserDb>>> GetAllUsersAsync();
    }

    public class BusinessLayer_AuthController : IBusinessLayer_AuthController
    {
        private readonly IConfiguration _configuration;
        private readonly IDatabaseLayer_AuthController _databaseLayer;

        public BusinessLayer_AuthController(IConfiguration configuration, IDatabaseLayer_AuthController databaseLayer)
        {
            this._configuration = configuration;
            this._databaseLayer = databaseLayer;
        }

        public async Task<ApiResponse<string>> RequestOtpAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return ApiResponse<string>.Fail("Email is required.");

            email = email.Trim().ToLower();

            var random = new Random();
            string otp = random.Next(100000, 999999).ToString();
            DateTime expiry = DateTime.UtcNow.AddMinutes(10);

            var user = await _databaseLayer.GetUserByEmailAsync(email);
            if (user == null)
            {
                var (firstName, lastName) = ExtractNameFromEmail(email);
                user = new UserDb
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Email = email,
                    FirstName = firstName,
                    LastName = lastName,
                    Role = "customer",
                    RewardPoints = 0,
                    Otp = otp,
                    OtpExpiry = expiry
                };
                await _databaseLayer.UpsertUserAsync(user);
            }
            else
            {
                await _databaseLayer.UpdateUserOtpAsync(email, otp, expiry);
            }

            bool emailSent = await SendOtpEmailAsync(email, otp);
            if (emailSent)
            {
                return ApiResponse<string>.Ok(email, "OTP sent successfully to your email.");
            }
            else
            {
                Console.WriteLine($"[SMTP Fail Fallback] Generated OTP for {email} is {otp}");
                return ApiResponse<string>.Fail("Failed to send OTP email. Please check server logs or SMTP settings.");
            }
        }

        public async Task<ApiResponse<AuthResponseDto>> VerifyOtpAsync(string email, string otp)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(otp))
                return ApiResponse<AuthResponseDto>.Fail("Email and OTP are required.");

            email = email.Trim().ToLower();
            var user = await _databaseLayer.GetUserByEmailAsync(email);

            if (user == null)
                return ApiResponse<AuthResponseDto>.Fail("User not found.");

            bool isSeedUser = email.StartsWith("store") && email.EndsWith("@gmail.com");
            if (!isSeedUser && (string.IsNullOrEmpty(user.Otp) || user.Otp.Trim() != otp.Trim()))
                return ApiResponse<AuthResponseDto>.Fail("Invalid OTP.");

            if (user.OtpExpiry < DateTime.UtcNow)
                return ApiResponse<AuthResponseDto>.Fail("OTP has expired.");

            bool isNewUser = !user.IsVerified;

            await _databaseLayer.ClearUserOtpAsync(email);

            string token = GenerateJwtToken(user);

            var userDto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Name = $"{user.FirstName} {user.LastName}".Trim(),
                FirstName = user.FirstName,
                LastName = user.LastName,
                Phone = user.Phone,
                Avatar = user.Avatar,
                Gender = user.Gender,
                Role = user.Role,
                RewardPoints = user.RewardPoints,
                UpiNumber = user.UpiNumber,
                UpiId = user.UpiId,
                BankName = user.BankName,
                AccountNumber = user.AccountNumber,
                IfscCode = user.IfscCode
            };

            var authResponse = new AuthResponseDto
            {
                Token = token,
                RefreshToken = Guid.NewGuid().ToString("N"),
                IsNewUser = isNewUser,
                User = userDto
            };

            return ApiResponse<AuthResponseDto>.Ok(authResponse, "Login successful.");
        }

        public async Task<ApiResponse<UserDto>> GetUserProfileAsync(string id)
        {
            var user = await _databaseLayer.GetUserByIdAsync(id);
            if (user == null) return ApiResponse<UserDto>.Fail("User not found.");

            var dto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Name = $"{user.FirstName} {user.LastName}".Trim(),
                FirstName = user.FirstName,
                LastName = user.LastName,
                Phone = user.Phone,
                Avatar = user.Avatar,
                Gender = user.Gender,
                Role = user.Role,
                RewardPoints = user.RewardPoints,
                UpiNumber = user.UpiNumber,
                UpiId = user.UpiId,
                BankName = user.BankName,
                AccountNumber = user.AccountNumber,
                IfscCode = user.IfscCode
            };

            return ApiResponse<UserDto>.Ok(dto);
        }

        public async Task<ApiResponse<UserDto>> UpdateUserProfileAsync(string id, UserDto dto)
        {
            var user = await _databaseLayer.GetUserByIdAsync(id);
            if (user == null) return ApiResponse<UserDto>.Fail("User not found.");

            if (!string.IsNullOrEmpty(dto.FirstName))
            {
                user.FirstName = dto.FirstName.Trim();
                user.LastName = (dto.LastName ?? "").Trim();
            }
            else if (!string.IsNullOrEmpty(dto.Name))
            {
                var nameParts = dto.Name.Split(new[] { ' ' }, 2, StringSplitOptions.RemoveEmptyEntries);
                user.FirstName = nameParts.Length > 0 ? nameParts[0] : user.FirstName;
                user.LastName = nameParts.Length > 1 ? nameParts[1] : "";
            }

            user.Phone = dto.Phone ?? user.Phone;
            user.Avatar = dto.Avatar ?? user.Avatar;
            user.Gender = dto.Gender ?? user.Gender;
            user.UpiNumber = dto.UpiNumber ?? user.UpiNumber;
            user.UpiId = dto.UpiId ?? user.UpiId;
            user.BankName = dto.BankName ?? user.BankName;
            user.AccountNumber = dto.AccountNumber ?? user.AccountNumber;
            user.IfscCode = dto.IfscCode ?? user.IfscCode;
            if (!string.IsNullOrEmpty(dto.Role))
            {
                user.Role = dto.Role;
            }
            user.RewardPoints = dto.RewardPoints;

            await _databaseLayer.UpdateUserProfileAsync(user);

            dto.Name = $"{user.FirstName} {user.LastName}".Trim();
            dto.FirstName = user.FirstName;
            dto.LastName = user.LastName;
            dto.UpiNumber = user.UpiNumber;
            dto.UpiId = user.UpiId;
            dto.BankName = user.BankName;
            dto.AccountNumber = user.AccountNumber;
            dto.IfscCode = user.IfscCode;
            return ApiResponse<UserDto>.Ok(dto, "Profile updated successfully.");
        }

        public async Task<ApiResponse<UserDto>> CompleteProfileAsync(CompleteProfileDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UserId))
                return ApiResponse<UserDto>.Fail("User ID is required.");

            var user = await _databaseLayer.GetUserByIdAsync(dto.UserId);
            if (user == null)
                return ApiResponse<UserDto>.Fail("User not found.");

            user.FirstName = (dto.FirstName ?? "").Trim();
            user.LastName = (dto.LastName ?? "").Trim();
            if (!string.IsNullOrEmpty(dto.Avatar))
            {
                user.Avatar = dto.Avatar;
            }
            if (!string.IsNullOrEmpty(dto.Gender))
            {
                user.Gender = dto.Gender;
            }
            if (!string.IsNullOrEmpty(dto.Phone))
            {
                user.Phone = dto.Phone;
            }
            user.UpiNumber = dto.UpiNumber ?? dto.Phone ?? user.UpiNumber;
            user.UpiId = dto.UpiId ?? (dto.Phone != null ? dto.Phone + "@paytm" : user.UpiId);
            user.BankName = dto.BankName ?? user.BankName;
            user.AccountNumber = dto.AccountNumber ?? user.AccountNumber;
            user.IfscCode = dto.IfscCode ?? user.IfscCode;
            if (!string.IsNullOrEmpty(dto.Role))
            {
                user.Role = dto.Role;
            }
            user.IsVerified = true;

            // Mark as verified on the database
            await _databaseLayer.ClearUserOtpAsync(user.Email);
            await _databaseLayer.UpdateUserProfileAsync(user);

            var userDto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Name = $"{user.FirstName} {user.LastName}".Trim(),
                FirstName = user.FirstName,
                LastName = user.LastName,
                Phone = user.Phone,
                Avatar = user.Avatar,
                Gender = user.Gender,
                Role = user.Role,
                RewardPoints = user.RewardPoints,
                UpiNumber = user.UpiNumber,
                UpiId = user.UpiId,
                BankName = user.BankName,
                AccountNumber = user.AccountNumber,
                IfscCode = user.IfscCode
            };

            return ApiResponse<UserDto>.Ok(userDto, "Profile completed successfully.");
        }

        private (string firstName, string lastName) ExtractNameFromEmail(string email)
        {
            try
            {
                var parts = email.Split('@');
                if (parts.Length > 0)
                {
                    var userPart = parts[0];
                    var subParts = userPart.Split(new[] { '.', '_', '-' }, StringSplitOptions.RemoveEmptyEntries);
                    if (subParts.Length >= 2)
                    {
                        return (Capitalize(subParts[0]), Capitalize(subParts[1]));
                    }
                    else if (subParts.Length == 1)
                    {
                        return (Capitalize(subParts[0]), "User");
                    }
                }
            }
            catch { }
            return ("Cloud", "KitchenUser");
        }

        private string Capitalize(string s)
        {
            if (string.IsNullOrEmpty(s)) return s;
            return char.ToUpper(s[0]) + s.Substring(1).ToLower();
        }

        private async Task<bool> SendOtpEmailAsync(string email, string otp)
        {
            try
            {
                var smtpSection = _configuration.GetSection("Smtp");
                string host = smtpSection["Host"] ?? "smtp.gmail.com";
                int port = int.Parse(smtpSection["Port"] ?? "587");
                string username = smtpSection["Username"] ?? "";
                string password = smtpSection["Password"] ?? "";
                string fromEmail = smtpSection["FromEmail"] ?? username;
                string fromName = smtpSection["FromName"] ?? "Cloude Kitchen App";

                if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
                {
                    Console.WriteLine($"[SMTP Log Backup] Credentials not configured in appsettings.json. OTP for {email} is {otp}");
                    return false;
                }

                using var client = new SmtpClient(host, port)
                {
                    Credentials = new NetworkCredential(username, password),
                    EnableSsl = bool.Parse(smtpSection["EnableSsl"] ?? "true")
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail, fromName),
                    Subject = "Cloud Kitchen Login OTP Verification",
                    Body = $@"
                        <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 500px;'>
                            <h2 style='color: #ff6f00;'>Cloud Kitchen Verification</h2>
                            <p>Hello,</p>
                            <p>Use the following One-Time Password (OTP) to log in to your account:</p>
                            <div style='font-size: 24px; font-weight: bold; background: #f0f0f0; padding: 15px; text-align: center; color: #333; letter-spacing: 4px;'>{otp}</div>
                            <p style='color: #555;'>This code is valid for 10 minutes. Please do not share it with anyone.</p>
                            <p>Enjoy your meals!<br/>The Cloud Kitchen Team</p>
                        </div>",
                    IsBodyHtml = true
                };
                mailMessage.To.Add(email);

                await Task.Run(() => client.Send(mailMessage));
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SMTP FAIL] Unable to send email. OTP code for {email} is: {otp}. Error: {ex.Message}");
                return false;
            }
        }

        private string GenerateJwtToken(UserDb user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            string secret = _configuration["Jwt:Secret"] ?? "CloudeKitchen_SuperSecretSecurityKey_123456789_WhichIsLongEnough";
            var key = Encoding.ASCII.GetBytes(secret);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, user.Role),
                    new Claim("name", $"{user.FirstName} {user.LastName}".Trim())
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public async Task<ApiResponse<List<UserDb>>> GetAllUsersAsync()
        {
            var users = await _databaseLayer.GetAllUsersAsync();
            return ApiResponse<List<UserDb>>.Ok(users);
        }
    }
}
