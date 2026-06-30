using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<CloudeKicten.Data.ApplicationUser>(options)
{
}
