// ======================
// CRYPTO WALLET SERVICE CLASS
// ======================
// Handles CRUD operations for cryptocurrency wallet addresses
// Manages storage and retrieval of crypto wallet information for deposits/withdrawals
// Typically used to store exchange or platform wallet addresses for different cryptocurrencies
class CryptoWalletService {
  constructor(CryptoWalletSchema) {
    // Initialize with the CryptoWallet model for database operations
    this.CryptoWalletSchema = CryptoWalletSchema; // Mongoose model for crypto wallets
  }

  // ======================
  // READ OPERATIONS
  // ======================

  /**
   * Retrieves all cryptocurrency wallet addresses from the database
   * Typically used to display available deposit wallets to users
   * 
   * @returns {Promise<Array>} - Array of all crypto wallet documents
   * 
   * Returns documents typically containing:
   * - _id: MongoDB unique identifier
   * - cryptoName: Cryptocurrency name (e.g., 'BTC', 'ETH', 'USDT')
   * - cryptoAddress: Wallet address for the cryptocurrency
   * - createdAt: When the wallet was added
   * - updatedAt: When the wallet was last updated
   * 
   * Usage Example:
   * const wallets = await cryptoWalletService.getCryptoWallet();
   * // Returns: [{ cryptoName: 'BTC', cryptoAddress: '1A1zP1...', ... }, ...]
   * 
   * Note: No filtering or pagination - returns ALL wallet records
   */
  async getCryptoWallet() {
    const CryptoWallet = await this.CryptoWalletSchema.find();
    return CryptoWallet;
  }

  // ======================
  // CREATE OPERATIONS
  // ======================

  /**
   * Creates a new cryptocurrency wallet address record
   * Typically used by admins to add new deposit addresses
   * 
   * @param {string} CryptoName - Name of the cryptocurrency (e.g., 'Bitcoin', 'Ethereum')
   * @param {string} CryptoAddress - The actual wallet address
   * @returns {Promise<Object>} - The newly created crypto wallet document
   * @throws {Error} - If CryptoName or CryptoAddress is missing
   * 
   * Workflow:
   * 1. Validate required parameters
   * 2. Convert cryptoName to uppercase for consistency
   * 3. Create new document with current timestamp
   * 4. Save to database
   * 
   * Security Note: No validation on address format - assumes address is valid
   * 
   * Usage Example:
   * const newWallet = await cryptoWalletService.CreateCryptoWallet(
   *   'Bitcoin',
   *   '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
   * );
   */
  async CreateCryptoWallet(CryptoName, CryptoAddress) {
    try {
      // 1. VALIDATION - Ensure all required fields are provided
      if (!CryptoName || !CryptoAddress) {
        throw new Error("CryptoName and CryptoAddress are required");
      }

      // 2. CREATE DOCUMENT - Initialize new crypto wallet record
      const CryptoWallet = new this.CryptoWalletSchema({
        cryptoName: CryptoName.toUpperCase(), // Store in uppercase for consistency
        cryptoAddress: CryptoAddress,
        // Note: createdAt and updatedAt are typically handled by timestamps in schema
      });

      // 3. SAVE TO DATABASE
      await CryptoWallet.save();

      return CryptoWallet;
    } catch (error) {
      // Wrap error with more descriptive message
      throw new Error("Error creating CryptoWallet: " + error.message);
    }
  }

  // ======================
  // UPDATE OPERATIONS
  // ======================

  /**
   * Updates an existing cryptocurrency wallet address
   * Used when wallet addresses need to be changed (e.g., exchange changes addresses)
   * 
   * @param {string} userId - NOTE: Misnamed parameter - should be walletId or cryptoWalletId
   *                        Actually represents the MongoDB _id of the crypto wallet document
   * @param {string} CryptoAddress - New wallet address to update to
   * @returns {Promise<Object>} - The updated crypto wallet document
   * @throws {Error} - If walletId or CryptoAddress is missing, or wallet not found
   * 
   * Important: The parameter name 'userId' is misleading - it's actually a wallet document ID
   * Consider renaming to 'walletId' or 'cryptoWalletId' for clarity
   * 
   * Workflow:
   * 1. Validate parameters
   * 2. Find wallet by ID
   * 3. Update address and timestamp
   * 4. Save changes
   * 
   * Usage Example:
   * const updatedWallet = await cryptoWalletService.UpdateCryptoWallet(
   *   '507f1f77bcf86cd799439011', // Wallet document ID (not user ID)
   *   'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
   * );
   */
  async UpdateCryptoWallet(userId, CryptoAddress) {
    try {
      // 1. VALIDATION - Check required parameters
      // Note: Parameter name 'userId' is misleading - should be 'walletId'
      if (!userId || !CryptoAddress) {
        throw new Error("Wallet ID and CryptoAddress are required");
      }

      // 2. FIND WALLET - Locate the crypto wallet document by ID
      const CryptoWallet = await this.CryptoWalletSchema.findById(userId);
      
      if (!CryptoWallet) {
        throw new Error("CryptoWallet not found");
      }

      // 3. UPDATE FIELDS - Modify address and update timestamp
      CryptoWallet.cryptoAddress = CryptoAddress;
      CryptoWallet.updatedAt = Date.now(); // Manual update timestamp

      // 4. SAVE CHANGES
      await CryptoWallet.save();

      return CryptoWallet;
    } catch (error) {
      throw new Error("Error updating CryptoWallet: " + error.message);
    }
  }

  // ======================
  // DELETE OPERATIONS
  // ======================

  /**
   * Deletes a cryptocurrency wallet address record
   * Used when a wallet is no longer in use or needs to be removed
   * 
   * @param {string} userId - NOTE: Misnamed parameter - should be walletId
   *                        MongoDB _id of the crypto wallet to delete
   * @returns {Promise<Object>} - The deleted crypto wallet document
   * @throws {Error} - If walletId is missing or wallet not found
   * 
   * Workflow:
   * 1. Validate wallet ID
   * 2. Find and delete document in one operation
   * 3. Return deleted document for confirmation
   * 
   * Note: Uses findByIdAndDelete which is atomic and returns the deleted document
   * 
   * Usage Example:
   * const deletedWallet = await cryptoWalletService.DeleteCryptoWallet(
   *   '507f1f77bcf86cd799439011' // Wallet document ID to delete
   * );
   */
  async DeleteCryptoWallet(userId) {
    try {
      // 1. VALIDATION - Ensure wallet ID is provided
      // Note: Parameter name 'userId' is misleading
      if (!userId) {
        throw new Error("Wallet ID is required");
      }

      // 2. DELETE OPERATION - Find and delete in one atomic operation
      const CryptoWallet = await this.CryptoWalletSchema.findByIdAndDelete(userId);
      
      // 3. VERIFY DELETION - Check if document was found and deleted
      if (!CryptoWallet) {
        throw new Error("CryptoWallet not found");
      }
      
      return CryptoWallet; // Return the deleted document for confirmation
    } catch (error) {
      throw new Error("Error deleting CryptoWallet: " + error.message);
    }
  }
}

// ======================
// MODULE EXPORT
// ======================
module.exports = CryptoWalletService;

// ======================
// KEY ARCHITECTURE NOTES:
// ======================
// 1. SINGLE COLLECTION SERVICE: Manages only crypto wallet addresses
// 2. ADMIN-ONLY OPERATIONS: Create, Update, Delete are typically admin functions
// 3. PUBLIC READ: getCryptoWallet() is typically public for users to see deposit addresses
// 4. SIMPLE CRUD: Basic Create, Read, Update, Delete operations
// 5. NO USER LINKAGE: Crypto wallets are not linked to specific users (platform wallets)

// ======================
// IMPORTANT NOTES:
// ======================
// 1. PARAMETER NAMING: 'userId' parameters are misleading - they're actually wallet document IDs
//    Consider renaming to: walletId, cryptoWalletId, or documentId
// 2. VALIDATION: Minimal validation - assumes addresses are valid
// 3. SECURITY: No access control in service - should be enforced at controller/routing level
// 4. ERROR HANDLING: Basic error wrapping but could be more sophisticated
// 5. AUDIT TRAIL: No logging of who made changes or when (except timestamps)

// ======================
// TYPICAL USAGE SCENARIOS:
// ======================
// 1. DISPLAY DEPOSIT ADDRESSES:
//    - Frontend calls getCryptoWallet() to show users where to send crypto
//    - Returns: [{cryptoName: 'BTC', cryptoAddress: '...'}, ...]
// 
// 2. ADMIN MANAGEMENT:
//    - Admin panel allows adding new crypto wallets via CreateCryptoWallet()
//    - Admin can update addresses via UpdateCryptoWallet() when addresses change
//    - Admin can remove old wallets via DeleteCryptoWallet()
// 
// 3. TRANSACTION PROCESSING:
//    - When user makes crypto deposit, system checks address against stored wallets
//    - Helps verify if deposit came to correct platform wallet

// ======================
// POTENTIAL ENHANCEMENTS:
// ======================
// 1. Add address format validation (regex for different cryptocurrencies)
// 2. Add wallet type/network information (e.g., ERC20, BEP20, Mainnet)
// 3. Add QR code generation for addresses
// 4. Add wallet status (active/inactive/maintenance)
// 5. Add minimum/maximum deposit amounts per wallet
// 6. Add wallet description/notes field
// 7. Implement soft delete instead of hard delete
// 8. Add change history/audit logging
// 9. Add wallet verification/confirmation process
// 10. Add support for multiple addresses per cryptocurrency

// ======================
// SECURITY CONSIDERATIONS:
// ======================
// 1. Ensure only admins can create/update/delete wallets
// 2. Validate wallet addresses before saving
// 3. Consider regular verification of wallet addresses
// 4. Implement approval workflow for wallet changes
// 5. Log all wallet modifications for audit purposes
// 6. Consider wallet address whitelisting/blacklisting

// ======================
// DATABASE SCHEMA EXPECTATION:
// ======================
// The CryptoWalletSchema should typically include:
// - cryptoName: String (required, uppercase)
// - cryptoAddress: String (required)
// - createdAt: Date (auto)
// - updatedAt: Date (auto)
// - Optional: network, type, status, minDeposit, maxDeposit, notes