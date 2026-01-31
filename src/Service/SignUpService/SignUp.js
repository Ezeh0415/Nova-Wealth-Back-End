// ======================
// SIGNUP SERVICE CLASS
// ======================
// Handles user registration and user existence checking
// This service encapsulates user creation logic and validation
class SignUpService {
  /**
   * Constructor - Initializes the service with the User model
   * @param {Model} UserModel - Mongoose User model for database operations
   */
  constructor({ UserModel, NotificationModel }) {
    this.UserModel = UserModel; // Store the User model for use in all methods
    this.NotificationModel = NotificationModel; // Store the Notification model
  }

  /**
   * Creates a new user in the database
   * This is the main user registration function
   *
   * @param {Object} user - User object containing registration data
   * @param {string} user.userName - Unique username for the user
   * @param {string} user.email - User's email address
   * @param {string} user.password - Hashed password (hashing should be done before calling this)
   * @param {string} user.fullName - User's full name
   * @param {string} user.country - User's country
   * @param {string} user.phoneNumber - User's phone number
   * @param {string} user.role - User role (e.g., 'user', 'admin') - optional, defaults in model
   *
   * @returns {Promise<Object>} - The newly created user document
   * @throws {Error} - If database save operation fails (e.g., duplicate key, validation error)
   *
   * Usage Example:
   * const service = new SignUpService(UserModel);
   * const newUser = await service.signUp({
   *   userName: 'john_doe',
   *   email: 'john@example.com',
   *   password: 'hashedPassword123',
   *   fullName: 'John Doe',
   *   country: 'USA',
   *   phoneNumber: '+1234567890'
   * });
   */
  async signUp(user) {
    // Create a new Mongoose document instance with the provided user data
    const newUser = new this.UserModel(user);

    // Save the user document to the MongoDB database
    // This will trigger any Mongoose schema validations and hooks
    await newUser.save();

    const notification = new this.NotificationModel({
      user: newUser._id,
      type: "signup",
      title: "Welcome to Our Platform!",
      message: `Hello ${newUser.fullName}, thank you for signing up! We're excited to have you on board.`,
      data: { userId: newUser._id },
      priority: "low",
      category: "system",
      icon:"signup",
    });

    await notification.save();

    return newUser; // Return the created user document
  }

  /**
   * Checks if a user already exists with the given username AND email
   * This is typically used during registration to prevent duplicate accounts
   *
   * @param {string} userName - Username to check
   * @param {string} email - Email address to check
   * @returns {Promise<Object|null>} - Returns the user document if found, null if not found
   *
   * Note: This checks for BOTH username AND email matching simultaneously
   * If you want to check for EITHER username OR email, you would need to modify the query
   *
   * Usage Example:
   * const existingUser = await service.checkUserExist('john_doe', 'john@example.com');
   * if (existingUser) {
   *   throw new Error('User already exists');
   * }
   */
  async checkUserExist(userName, email) {
    // Query the database for a user with both matching username AND email
    return await this.UserModel.findOne({
      userName: userName,
      email: email,
    });
  }

  // ================================================================
  // POTENTIAL ENHANCEMENTS/ADDITIONAL METHODS (NOT IMPLEMENTED YET)
  // ================================================================

  // Uncomment and implement these methods if needed:

  /**
   * Alternative: Check if EITHER username OR email exists
   * More common use case for registration validation
   *
   * @param {string} userName - Username to check
   * @param {string} email - Email to check
   * @returns {Promise<Object|null>} - First found user with either username or email
   */
  // async checkUserExistByUsernameOrEmail(userName, email) {
  //   return await this.UserModel.findOne({
  //     $or: [{ userName: userName }, { email: email }]
  //   });
  // }

  /**
   * Check if username exists (for username availability check)
   *
   * @param {string} userName - Username to check
   * @returns {Promise<boolean>} - True if username exists, false otherwise
   */
  // async isUsernameTaken(userName) {
  //   const user = await this.UserModel.findOne({ userName: userName });
  //   return !!user; // Convert to boolean
  // }

  /**
   * Check if email exists (for email availability check)
   *
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} - True if email exists, false otherwise
   */
  // async isEmailTaken(email) {
  //   const user = await this.UserModel.findOne({ email: email });
  //   return !!user; // Convert to boolean
  // }
}

// ======================
// MODULE EXPORT
// ======================
module.exports = SignUpService;

// ======================
// KEY POINTS:
// ======================
// 1. RESPONSIBILITY: Handles user creation and existence checking only
// 2. SEPARATION OF CONCERNS: Does NOT handle:
//    - Password hashing (should be done in controller before calling signUp)
//    - Input validation (should be done in middleware)
//    - Email sending (should be done in separate email service)
// 3. DEPENDENCY INJECTION: UserModel is injected for testability
// 4. SIMPLICITY: Currently minimal - can be extended with more methods
// 5. DATABASE: Direct MongoDB operations through Mongoose

// ======================
// TYPICAL USAGE FLOW:
// ======================
// 1. Controller receives registration request
// 2. Middleware validates input (username format, email validity, etc.)
// 3. Controller hashes password
// 4. Controller calls checkUserExist() to prevent duplicates
// 5. Controller calls signUp() with user data
// 6. Controller sends appropriate response based on result

// ======================
// IMPORTANT NOTES:
// ======================
// 1. The current checkUserExist() method looks for EXACT username AND email match
//    This might not be the most common use case - consider modifying if needed
// 2. No error handling within the methods - errors bubble up to the controller
// 3. Consider adding more validation here if business logic gets complex
// 4. Could add methods for updating user info, deleting users, etc.
