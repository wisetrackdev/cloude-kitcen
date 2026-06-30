using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using CloudeKicten.Data;
using CloudeKicten.Models.BusinessLayer;
using CloudeKicten.Models.DatabaseLayer;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace CloudeKicten
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            
            // Connection String
            var connectionString = builder.Configuration.GetConnectionString("AppDbContext") 
                ?? throw new InvalidOperationException("Connection string 'AppDbContext' not found.");

            // EF Core DbContext (retained for identity or general compatibility)
            builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
            builder.Services.AddDefaultIdentity<ApplicationUser>(options => options.SignIn.RequireConfirmedAccount = true)
                .AddEntityFrameworkStores<AppDbContext>();

            // Setup CORS for mobile and web clients
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                });
            });

            // Register Custom Modular Dependency Injection Layers
            // Auth Controller Dependencies
            builder.Services.AddScoped<IDatabaseLayer_AuthController, DatabaseLayer_AuthController>();
            builder.Services.AddScoped<IBusinessLayer_AuthController, BusinessLayer_AuthController>();

            // Kitchen Controller Dependencies
            builder.Services.AddScoped<IDatabaseLayer_KitchenController, DatabaseLayer_KitchenController>();
            builder.Services.AddScoped<IBusinessLayer_KitchenController, BusinessLayer_KitchenController>();

            // Product Controller Dependencies
            builder.Services.AddScoped<IDatabaseLayer_ProductController, DatabaseLayer_ProductController>();
            builder.Services.AddScoped<IBusinessLayer_ProductController, BusinessLayer_ProductController>();

            // Order Controller Dependencies
            builder.Services.AddScoped<IDatabaseLayer_OrderController, DatabaseLayer_OrderController>();
            builder.Services.AddScoped<IBusinessLayer_OrderController, BusinessLayer_OrderController>();

            // Meal Subscription Dependencies
            builder.Services.AddScoped<IDatabaseLayer_SubscriptionController, DatabaseLayer_SubscriptionController>();
            builder.Services.AddScoped<IBusinessLayer_SubscriptionController, BusinessLayer_SubscriptionController>();

            // Kitchen Booking Dependencies
            builder.Services.AddScoped<IDatabaseLayer_BookingController, DatabaseLayer_BookingController>();
            builder.Services.AddScoped<IBusinessLayer_BookingController, BusinessLayer_BookingController>();

            // Rider Dependencies
            builder.Services.AddScoped<IDatabaseLayer_RiderController, DatabaseLayer_RiderController>();
            builder.Services.AddScoped<IBusinessLayer_RiderController, BusinessLayer_RiderController>();

            // Upload Controller Dependencies
            builder.Services.AddScoped<IBusinessLayer_UploadController, BusinessLayer_UploadController>();

            // Category Dependencies
            builder.Services.AddScoped<IDatabaseLayer_CategoryController, DatabaseLayer_CategoryController>();
            builder.Services.AddScoped<IBusinessLayer_CategoryController, BusinessLayer_CategoryController>();

            // Coupon Dependencies
            builder.Services.AddScoped<IDatabaseLayer_CouponController, DatabaseLayer_CouponController>();
            builder.Services.AddScoped<IBusinessLayer_CouponController, BusinessLayer_CouponController>();

            // Wallet & Payment Dependencies
            builder.Services.AddScoped<IDatabaseLayer_WalletController, DatabaseLayer_WalletController>();
            builder.Services.AddScoped<IBusinessLayer_WalletController, BusinessLayer_WalletController>();

            // Review Dependencies
            builder.Services.AddScoped<IDatabaseLayer_ReviewController, DatabaseLayer_ReviewController>();
            builder.Services.AddScoped<IBusinessLayer_ReviewController, BusinessLayer_ReviewController>();

            // Notification Dependencies
            builder.Services.AddScoped<IDatabaseLayer_NotificationController, DatabaseLayer_NotificationController>();
            builder.Services.AddScoped<IBusinessLayer_NotificationController, BusinessLayer_NotificationController>();

            // Admin & Dashboard Dependencies
            builder.Services.AddScoped<IDatabaseLayer_AdminController, DatabaseLayer_AdminController>();
            builder.Services.AddScoped<IBusinessLayer_AdminController, BusinessLayer_AdminController>();

            // Configure JWT Authentication
            var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "CloudeKitchen_SuperSecretSecurityKey_123456789_WhichIsLongEnough";
            var key = Encoding.ASCII.GetBytes(jwtSecret);

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = false;
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false
                };
            });

            // Add Controllers
            builder.Services.AddControllersWithViews();
            builder.Services.AddControllers(); // Support API Attribute routing

            var app = builder.Build();

            // Auto-initialize Database tables if they do not exist (run via Auth Database Layer)
            using (var scope = app.Services.CreateScope())
            {
                var authDbLayer = scope.ServiceProvider.GetRequiredService<IDatabaseLayer_AuthController>();
                try
                {
                    await authDbLayer.InitializeDatabaseAsync();
                    Console.WriteLine("PostgreSQL Database tables verified and initialized successfully.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error initializing database: {ex.Message}");
                }
            }

            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Home/Error");
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            
            // Enable CORS
            app.UseCors("AllowAll");

            app.UseRouting();

            // Authentication & Authorization middlewares in order
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapStaticAssets();
            
            // Map default web route
            app.MapControllerRoute(
                name: "default",
                pattern: "{controller=Home}/{action=Index}/{id?}")
                .WithStaticAssets();

            // Map API controllers
            app.MapControllers();

            await app.RunAsync();
        }
    }
}
