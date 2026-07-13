using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CloudeKicten.Models.DatabaseLayer;

namespace CloudeKicten.Models.BusinessLayer
{
    public interface IBusinessLayer_WalletController
    {
        Task<ApiResponse<WalletDb>> GetWalletAsync(string userId);
        Task<ApiResponse<WalletDb>> CreditWalletAsync(string userId, decimal amount, string description);
        Task<ApiResponse<WalletDb>> DebitWalletAsync(string userId, decimal amount, string description);
        Task<ApiResponse<List<WalletTransactionDb>>> GetTransactionHistoryAsync(string userId);
        Task<ApiResponse<bool>> ProcessPaymentAsync(string? orderId, string? subId, decimal amount, string method, string transactionId, string status);
        Task<ApiResponse<PayoutCycleInfoDto>> GetPayoutCycleInfoAsync(string userId);
    }

    public class BusinessLayer_WalletController : IBusinessLayer_WalletController
    {
        private readonly IDatabaseLayer_WalletController _databaseLayer;

        public BusinessLayer_WalletController(IDatabaseLayer_WalletController databaseLayer)
        {
            this._databaseLayer = databaseLayer;
        }

        public async Task<ApiResponse<WalletDb>> GetWalletAsync(string userId)
        {
            await _databaseLayer.EnsureWalletExistsAsync(userId);
            var wallet = await _databaseLayer.GetWalletByUserIdAsync(userId);
            if (wallet == null) return ApiResponse<WalletDb>.Fail("Failed to retrieve wallet.");
            return ApiResponse<WalletDb>.Ok(wallet);
        }

        public async Task<ApiResponse<WalletDb>> CreditWalletAsync(string userId, decimal amount, string description)
        {
            if (amount <= 0) return ApiResponse<WalletDb>.Fail("Amount must be greater than zero.");
            
            var success = await _databaseLayer.UpdateWalletBalanceAsync(userId, amount, "credit", description);
            if (!success) return ApiResponse<WalletDb>.Fail("Wallet balance update failed.");

            var wallet = await _databaseLayer.GetWalletByUserIdAsync(userId);
            return ApiResponse<WalletDb>.Ok(wallet!, $"Credited ₹{amount} to wallet successfully.");
        }

        public async Task<ApiResponse<WalletDb>> DebitWalletAsync(string userId, decimal amount, string description)
        {
            if (amount <= 0) return ApiResponse<WalletDb>.Fail("Amount must be greater than zero.");

            await _databaseLayer.EnsureWalletExistsAsync(userId);
            var wallet = await _databaseLayer.GetWalletByUserIdAsync(userId);
            if (wallet == null || wallet.Balance < amount)
            {
                return ApiResponse<WalletDb>.Fail("Insufficient wallet balance.");
            }

            var success = await _databaseLayer.UpdateWalletBalanceAsync(userId, -amount, "debit", description);
            if (!success) return ApiResponse<WalletDb>.Fail("Wallet balance update failed.");

            var updatedWallet = await _databaseLayer.GetWalletByUserIdAsync(userId);
            return ApiResponse<WalletDb>.Ok(updatedWallet!, $"Debited ₹{amount} from wallet successfully.");
        }

        public async Task<ApiResponse<List<WalletTransactionDb>>> GetTransactionHistoryAsync(string userId)
        {
            var list = await _databaseLayer.GetWalletTransactionsAsync(userId);
            return ApiResponse<List<WalletTransactionDb>>.Ok(list);
        }

        public async Task<ApiResponse<bool>> ProcessPaymentAsync(string? orderId, string? subId, decimal amount, string method, string transactionId, string status)
        {
            string id = "PAY-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
            var result = await _databaseLayer.InsertPaymentAsync(id, orderId, subId, amount, method, transactionId, status);
            if (!result) return ApiResponse<bool>.Fail("Failed to log payment transaction.");
            return ApiResponse<bool>.Ok(true, "Payment transaction completed successfully.");
        }

        public async Task<ApiResponse<PayoutCycleInfoDto>> GetPayoutCycleInfoAsync(string userId)
        {
            var info = await _databaseLayer.GetPayoutCycleInfoAsync(userId);
            return ApiResponse<PayoutCycleInfoDto>.Ok(info);
        }
    }
}
