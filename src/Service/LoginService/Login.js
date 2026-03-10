// ======================
// LOGIN SERVICE CLASS
// ======================
// Handles user authentication by finding users by username
// This service is responsible for retrieving user data during login attempts
class Login {
  /**
   * Constructor - Initializes the service with the User model
   * @param {Model} UserModel - Mongoose User model for database operations
   */
  constructor(UserModel) {
    this.UserModel = UserModel; // Store the User model for database queries
  }

  /**
   * Finds a user by their username for login purposes
   * This method is used during authentication to retrieve user credentials
   *
   * @param {string} userName - The username to search for in the database
   * @returns {Promise<Object|null>} - Returns the user document if found, null if not found
   *
   * Important Notes:
   * 1. This method ONLY finds by username - not by email or other identifiers
   * 2. It returns the ENTIRE user document including the hashed password
   * 3. Password comparison should be done in the controller/service layer
   *
   * The returned user object typically contains:
   * - _id: MongoDB unique identifier
   * - userName: Username used for login
   * - email: User's email address
   * - password: Hashed password (for comparison)
   * - fullName: User's full name
   * - role: User permissions/role
   * - isVerified: Email verification status
   * - createdAt: Account creation date
   * - lastLogin: Last successful login timestamp
   *
   * Usage Example:
   * const loginService = new Login(UserModel);
   * const user = await loginService.login('john_doe');
   *
   * if (!user) {
   *   throw new Error('User not found');
   * }
   *
   * // Compare password
   * const isPasswordValid = await bcrypt.compare(password, user.password);
   * if (!isPasswordValid) {
   *   throw new Error('Invalid password');
   * }
   */
  async login(userName) {
    // Query the database for a user with the exact matching username
    // Uses Mongoose's findOne method with case-sensitive matching
    //return await this.UserModel.findOne({ userName: userName });
    return await this.UserModel.findOne({
      $or: [
       { userName: userName },
      { email: userName }
       ]
     });
  }

  // ================================================================
  // POTENTIAL ENHANCEMENTS/ADDITIONAL METHODS (NOT IMPLEMENTED YET)
  // ================================================================

  // Uncomment and implement these methods if needed:

  /**
   * Alternative: Find user by username OR email
   * More flexible login allowing users to use either identifier
   *
   * @param {string} identifier - Username OR email to search for
   * @returns {Promise<Object|null>} - User document if found
   */
  // async loginByUsernameOrEmail(identifier) {
  //   return await this.UserModel.findOne({
  //     $or: [
  //       { userName: identifier },
  //       { email: identifier }
  //     ]
  //   });
  // }

  /**
   * Update user's last login timestamp
   * Typically called after successful authentication
   *
   * @param {string} userId - User's ID
   * @returns {Promise<Object>} - Updated user document
   */
  // async updateLastLogin(userId) {
  //   return await this.UserModel.findByIdAndUpdate(
  //     userId,
  //     { lastLogin: new Date() },
  //     { new: true } // Return the updated document
  //   );
  // }

  /**
   * Increment failed login attempts
   * Security feature for tracking suspicious activity
   *
   * @param {string} userId - User's ID
   * @returns {Promise<Object>} - Updated user document
   */
  // async incrementFailedAttempts(userId) {
  //   return await this.UserModel.findByIdAndUpdate(
  //     userId,
  //     { $inc: { failedLoginAttempts: 1 } },
  //     { new: true }
  //   );
  // }

  /**
   * Reset failed login attempts (after successful login)
   *
   * @param {string} userId - User's ID
   * @returns {Promise<Object>} - Updated user document
   */
  // async resetFailedAttempts(userId) {
  //   return await this.UserModel.findByIdAndUpdate(
  //     userId,
  //     { failedLoginAttempts: 0 },
  //     { new: true }
  //   );
  // }

  /**
   * Lock user account (after too many failed attempts)
   *
   * @param {string} userId - User's ID
   * @returns {Promise<Object>} - Updated user document
   */
  // async lockAccount(userId) {
  //   return await this.UserModel.findByIdAndUpdate(
  //     userId,
  //     {
  //       isLocked: true,
  //       lockedUntil: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  //     },
  //     { new: true }
  //   );
  // }

  /**
   * Check if account is locked
   *
   * @param {string} userId - User's ID
   * @returns {Promise<boolean>} - True if account is currently locked
   */
  // async isAccountLocked(userId) {
  //   const user = await this.UserModel.findById(userId);
  //   if (!user) return false;
  //
  //   if (user.isLocked && user.lockedUntil > new Date()) {
  //     return true; // Account is still locked
  //   }
  //
  //   // If lock has expired, automatically unlock
  //   if (user.isLocked && user.lockedUntil <= new Date()) {
  //     await this.unlockAccount(userId);
  //     return false;
  //   }
  //
  //   return false;
  // }
}

// ======================
// MODULE EXPORT
// ======================
module.exports = Login;

// ======================
// KEY POINTS:
// ======================
// 1. SINGLE RESPONSIBILITY: Only finds users by username - doesn't validate passwords
// 2. AUTHENTICATION FLOW: Part 1 of 2-step authentication process:
//    Step 1: Find user by username (this service)
//    Step 2: Compare password hash (in controller or auth service)
// 3. SIMPLICITY: Minimal implementation - can be extended as needed
// 4. SECURITY: Returns hashed password for comparison but doesn't expose it in responses

// ======================
// TYPICAL AUTHENTICATION FLOW:
// ======================
// 1. User submits login form with username and password
// 2. Controller calls login(userName) to retrieve user
// 3. If user not found, return "Invalid credentials" (don't specify which is wrong)
// 4. If user found, compare submitted password with stored hash using bcrypt
// 5. If password matches:
//    - Generate JWT token
//    - Update lastLogin timestamp
//    - Reset failed login attempts
//    - Return token and user data (excluding password)
// 6. If password doesn't match:
//    - Increment failed login attempts
//    - Check if account should be locked
//    - Return "Invalid credentials"

// ======================
// SECURITY CONSIDERATIONS:
// ======================
// 1. Always use case-sensitive username matching (current implementation does)
// 2. Consider adding login attempt throttling to prevent brute force
// 3. Don't reveal whether username exists or not in error messages
// 4. Use parameterized queries to prevent injection (Mongoose handles this)
// 5. Store passwords using strong hashing algorithms (bcrypt, argon2)

// ======================
// IMPORTANT NOTES:
// ======================
// 1. This service only handles username lookup - password validation is separate
// 2. Consider expanding to allow email login as well
// 3. Add account lockout features for security
// 4. Consider adding login audit logging
