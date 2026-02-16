const WalletService = require("./Transaction");

// Mock mongoose to handle the specific import style and ObjectId creation
jest.mock("mongoose", () => ({
  __esModule: true,
  default: {
    Types: {
      ObjectId: jest.fn((id) => id),
    },
  },
  Types: {
    ObjectId: jest.fn((id) => id),
  },
}));

describe("WalletService", () => {
  let walletService;
  let mockUserModel;
  let mockWalletModel;
  let mockTransactionModel;
  let mockAdminTransactionModel;
  let mockNotificationModel;
  let mockReferralModel;

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize mocks
    mockUserModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    mockWalletModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockTransactionModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockAdminTransactionModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      countDocuments: jest.fn(),
      save: jest.fn(),
    };

    // Mock NotificationModel as a constructor and with static methods
    mockNotificationModel = jest.fn().mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(true),
    }));
    mockNotificationModel.create = jest.fn().mockResolvedValue(true);

    mockReferralModel = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    // Instantiate service with mocks
    walletService = new WalletService({
      userModel: mockUserModel,
      WalletModel: mockWalletModel,
      TransactionModel: mockTransactionModel,
      AdminTransactionModel: mockAdminTransactionModel,
      NotificationModel: mockNotificationModel,
      ReferralModel: mockReferralModel,
    });
  });

  describe("requestDeposit", () => {
    it("should successfully create a deposit request", async () => {
      const userId = "user123";
      const amount = 100;
      const currency = "USD";

      mockUserModel.findOne.mockResolvedValue({
        _id: userId,
        email: "test@test.com",
        fullName: "Test User",
        userName: "testuser",
      });

      // No existing pending deposit
      mockTransactionModel.findOne.mockResolvedValue(null);

      const mockWallet = {
        userId,
        pending: 0,
        save: jest.fn(),
      };
      mockWalletModel.findOne.mockResolvedValue(mockWallet);

      mockTransactionModel.create.mockResolvedValue({ _id: "trans123" });

      const result = await walletService.requestDeposit(
        userId,
        amount,
        currency,
      );

      expect(result.success).toBe(true);
      expect(result.data.amount).toBe(100);
      // Check conversion to kobo (100 * 100 = 10000)
      expect(mockWallet.pending).toBe(10000);
      expect(mockWallet.save).toHaveBeenCalled();
      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestedAmount: 10000,
          type: "deposit",
          status: "pending",
        }),
      );
      expect(mockAdminTransactionModel.create).toHaveBeenCalled();
    });

    it("should fail if user has a pending deposit", async () => {
      const userId = "user123";
      mockUserModel.findOne.mockResolvedValue({ _id: userId });

      // Existing pending deposit found
      mockTransactionModel.findOne.mockResolvedValue({ _id: "pendingTrans" });

      const result = await walletService.requestDeposit(userId, 100, "USD");

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/already has a pending deposit/);
    });

    it("should create a new wallet if one does not exist", async () => {
      const userId = "user123";
      mockUserModel.findOne.mockResolvedValue({ _id: userId });
      mockTransactionModel.findOne.mockResolvedValue(null);
      mockWalletModel.findOne.mockResolvedValue(null); // No wallet found

      const newWallet = { userId, pending: 0, save: jest.fn() };
      mockWalletModel.create.mockResolvedValue(newWallet);
      mockTransactionModel.create.mockResolvedValue({ _id: "trans123" });

      await walletService.requestDeposit(userId, 100, "USD");

      expect(mockWalletModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
      );
    });
  });

  describe("WithdrawalRequest", () => {
    it("should successfully create a withdrawal request", async () => {
      const userId = "user123";
      const amount = 50;
      const currency = "USD";
      const walletAddress = "0x123abc";

      mockUserModel.findOne.mockResolvedValue({
        _id: userId,
        email: "test@test.com",
        fullName: "Test User",
      });

      const mockWallet = {
        userId,
        balance: 10000, // 100 USD
        pendingWithdraw: 0,
        save: jest.fn(),
      };
      mockWalletModel.findOne.mockResolvedValue(mockWallet);
      mockTransactionModel.create.mockResolvedValue({ _id: "trans123" });

      const result = await walletService.WithdrawalRequest(
        userId,
        amount,
        currency,
        walletAddress,
      );

      expect(result.success).toBe(true);
      // 50 USD = 5000 kobo deducted
      expect(mockWallet.balance).toBe(5000);
      expect(mockWallet.pendingWithdraw).toBe(5000);
      expect(mockWallet.save).toHaveBeenCalled();
      expect(mockAdminTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          walletAddress: walletAddress,
          type: "withdraw",
        }),
      );
    });

    it("should fail if insufficient balance", async () => {
      const userId = "user123";
      mockUserModel.findOne.mockResolvedValue({ _id: userId });

      const mockWallet = {
        userId,
        balance: 1000, // 10 USD
        save: jest.fn(),
      };
      mockWalletModel.findOne.mockResolvedValue(mockWallet);

      const result = await walletService.WithdrawalRequest(
        userId,
        50, // Requesting 50 USD
        "USD",
        "0x123",
      );

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Insufficient balance/);
    });
  });

  describe("confirmDeposit", () => {
    it("should confirm deposit and update wallet balances", async () => {
      const userId = "user123";
      const amount = 5000; // 5000 kobo passed from admin
      const transactionId = "trans123";

      const mockAdminTrans = {
        transactionId,
        isConfirmed: "pending",
        save: jest.fn(),
      };
      mockAdminTransactionModel.findOne.mockResolvedValue(mockAdminTrans);

      const mockUser = {
        _id: userId,
        hasMadeFirstDeposit: true, // Not first deposit
        save: jest.fn(),
      };
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const mockWallet = {
        userId,
        pending: 5000,
        balance: 1000,
        totalDeposits: 1000,
        save: jest.fn(),
      };
      mockWalletModel.findOne.mockResolvedValue(mockWallet);

      const mockTrans = {
        _id: transactionId,
        requestedAmount: 5000,
        creditedAmount: 0,
        status: "pending",
        save: jest.fn(),
      };
      mockTransactionModel.findById.mockResolvedValue(mockTrans);

      const result = await walletService.confirmDeposit(
        userId,
        amount,
        transactionId,
      );

      expect(result.success).toBe(true);
      expect(mockWallet.pending).toBe(0);
      expect(mockWallet.balance).toBe(6000); // 1000 + 5000
      expect(mockWallet.totalDeposits).toBe(6000);
      expect(mockAdminTrans.isConfirmed).toBe("true");
      expect(mockTrans.status).toBe("completed");
    });

    it("should process referral bonus on first deposit", async () => {
      const userId = "user123";
      const referrerId = "referrer456";
      const amount = 5000; // 50 USD (min required for bonus)

      mockAdminTransactionModel.findOne.mockResolvedValue({
        isConfirmed: "pending",
        save: jest.fn(),
      });

      const mockUser = {
        _id: userId,
        userName: "newuser",
        hasMadeFirstDeposit: false, // First deposit
        referredBy: "refcode",
        save: jest.fn(),
      };
      mockUserModel.findOne.mockResolvedValue(mockUser);

      // User wallet
      const mockUserWallet = {
        userId,
        pending: 5000,
        balance: 0,
        totalDeposits: 0,
        save: jest.fn(),
      };

      // Referrer wallet
      const mockReferrerWallet = {
        userId: referrerId,
        balance: 10000,
        save: jest.fn(),
      };

      // Mock findOne to return user wallet first, then referrer wallet
      mockWalletModel.findOne
        .mockResolvedValueOnce(mockUserWallet)
        .mockResolvedValueOnce(mockReferrerWallet);

      mockTransactionModel.findById.mockResolvedValue({
        requestedAmount: 5000,
        save: jest.fn(),
      });

      // Referral record
      const mockReferral = {
        referrer: referrerId,
        referredUser: userId,
        status: "pending",
        save: jest.fn(),
      };
      mockReferralModel.findOne.mockResolvedValue(mockReferral);

      const result = await walletService.confirmDeposit(
        userId,
        amount,
        "trans123",
      );

      expect(result.isFirstDeposit).toBe(true);
      expect(result.referralBonus.bonusAwarded).toBe(true);
      expect(mockReferrerWallet.balance).toBe(11000); // 10000 + 1000 bonus
      expect(mockReferral.status).toBe("credited");
      expect(mockUser.hasMadeFirstDeposit).toBe(true);
    });
  });

  describe("confirmWithdrawal", () => {
    it("should confirm withdrawal and update wallet stats", async () => {
      const userId = "user123";
      const amount = 5000;
      const transactionId = "trans123";

      mockAdminTransactionModel.findOne.mockResolvedValue({
        isConfirmed: "pending",
        save: jest.fn(),
      });

      const mockWallet = {
        userId,
        pendingWithdraw: 5000,
        totalWithdrawals: 0,
        balance: 0, // Balance already deducted during request
        save: jest.fn(),
      };
      mockWalletModel.findOne.mockResolvedValue(mockWallet);

      mockTransactionModel.findById.mockResolvedValue({
        requestedAmount: 5000,
        save: jest.fn(),
      });

      const result = await walletService.confirmWithdrawal(
        userId,
        amount,
        transactionId,
      );

      expect(result.success).toBe(true);
      expect(mockWallet.pendingWithdraw).toBe(0);
      expect(mockWallet.totalWithdrawals).toBe(5000);
    });
  });
});
