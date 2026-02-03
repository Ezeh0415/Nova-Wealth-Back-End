// ======================
// SIGNUP SERVICE CLASS
// ======================
// Handles user registration and user existence checking

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../../middlewares/JWT-Token");

// This service encapsulates user creation logic and validation
class SignUpService {
  /**
   * Constructor - Initializes the service with the User model
   * @param {Model} UserModel - Mongoose User model for database operations
   * @param {Model} WalletModel - Mongoose wallet model for database operations
   * @param {Model} NotificationModel - Mongoose notification model for database operations
   * @param {Model} ReferralModel - Mongoose referral model for database operations
   */
  constructor({ UserModel, WalletModel, NotificationModel, ReferralModel }) {
    this.UserModel = UserModel; // Store the User model for use in all methods
    this.WalletModel = WalletModel; // Store the Wallet model
    this.NotificationModel = NotificationModel; // Store the Notification model
    this.ReferralModel = ReferralModel; // Store the Referral model
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
  async signUp(userData) {
    try {
      const { fullName, userName, email, password, referralCode } = userData;

      // 1️⃣ Validate fields
      if (!fullName || !userName || !email || !password) {
        throw new Error("All fields are required");
      }

      if (fullName.length < 3 || fullName.length > 50) {
        throw new Error("Full name must be between 3 and 50 characters");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Invalid email format");
      }

      // 2️⃣ Check if user exists (case-insensitive)
      const existingUser = await this.UserModel.findOne({
        $or: [
          { username: { $regex: new RegExp(`^${userName}$`, "i") } },
          { email: { $regex: new RegExp(`^${email}$`, "i") } },
        ],
      });

      if (existingUser) {
        if (existingUser.username.toLowerCase() === userName.toLowerCase()) {
          throw new Error("Username already exists");
        }
        if (existingUser.email.toLowerCase() === email.toLowerCase()) {
          throw new Error("Email already exists");
        }
      }

      // 3️⃣ Create new user object
      const newUser = new this.UserModel({
        fullName,
        username: userName,
        email: email.toLowerCase(),
        password,
      });

      // 4️⃣ Handle referral if code is provided
      if (referralCode && referralCode.trim() !== "") {
        const referrer = await this.UserModel.findOne({
          referralCode: referralCode.trim(),
        });

        if (referrer) {
          // Link new user to referrer
          newUser.referredBy = referrer._id;

          // Create referral record
          const referral = new this.ReferralModel({
            referrer: referrer._id,
            referredUser: newUser._id,
            referralCodeUsed: referralCode.trim(),
            status: "pending",
          });
          await referral.save();

          // Update referrer's referrals array
          referrer.referrals.push(newUser._id);
          referrer.totalReferrals += 1;
          await referrer.save();

          const wallet = this.WalletModel.findOne({ userId: newUser._id });
          wallet.balance = 10; // Example bonus amount
          await wallet.save();

          console.log(`User ${userName} referred by ${referrer.username}`);
        } else {
          console.log(`Invalid referral code: ${referralCode}`);
        }
      }

      // 5️⃣ Save the new user
      await newUser.save();

      // 6️⃣ Generate tokens
      const accessToken = this.generateAccessToken(newUser._id);
      const refreshToken = this.generateRefreshToken(newUser._id);

      // 7️⃣ Automatically create wallet
      await this.WalletModel.create({
        userId: newUser._id,
        balance: 0,
        currency: "USD",
      });

      // 8️⃣ Create welcome notification
      const notification = new this.NotificationModel({
        user: newUser._id,
        type: "WELCOME",
        title: "Welcome to Our Platform!",
        message: `Hello ${newUser.fullName}, thank you for signing up! We're excited to have you on board.`,
        data: { userId: newUser._id },
        priority: "success",
        category: "account",
        icon: "party-popper",
      });
      await notification.save();

      // 9️⃣ Return sanitized user data
      const safeUser = {
        id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        referralCode: newUser.referralCode,
        referredBy: newUser.referredBy,
        createdAt: newUser.createdAt,
        isVerified: newUser.isVerified,
      };

      return {
        success: true,
        message: "User created successfully",
        data: safeUser,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }
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
