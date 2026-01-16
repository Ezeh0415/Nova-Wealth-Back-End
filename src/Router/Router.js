const Router = require("express").Router();
const cron = require("node-cron");

// controller section
const SignUpController = require("../Controller/SignUpContr/SignUp");
const LoginController = require("../Controller/LoginContr/Login");
const ForgotPasswordController = require("../Controller/ForgotPasswordContr/ForgotPassword");
const DashBoardContr = require("../Controller/DashBoardContr/DashBoardContr");
const InvestmentContr = require("../Controller/InvestmentContr/Investment");
const CryptoWalletContr = require("../Controller/CryptoWalletContr/CryptoWallet");

// service section
const SignUpService = require("../Service/SignUpService/SignUp");
const LoginService = require("../Service/LoginService/Login");
const ForgotPasswordService = require("../Service/forgotPassword/forgotPassword");
const DashBoardService = require("../Service/DashBoardService/DashBoardService");
const WalletService = require("../Service/TransactionService/Transaction");
const InvestmentService = require("../Service/InvestmentService/investment");
const CryptoWalletService = require("../Service/CryptoWalletService/CryptoWallet");

// schema section
const User = require("../Models/UserSchema");
const WalletSchema = require("../Models/WalletSchema");
const TransactionSchema = require("../Models/TransactionSchema");
const InvestmentSchema = require("../Models/InvestmentSchema");
const AdminTransactionSchema = require("../Models/AdminTransactionSchema");
const CryptoWalletSchema = require("../Models/CryptoWalletSchema");

// middlewares section
const Require_jwt_key = require("../../middlewares/JWT-key");
const Require_Api_key = require("../../middlewares/Api-key");
const validate = require("../../middlewares/validate");

// middlewares validation sections
const Payment = require("../Controller/paymentConfirm/payment");
const {
  investmentValidator,
} = require("../../middlewares/Validators/InvestmentValidator");
const {
  registerValidator,
} = require("../../middlewares/Validators/RegisterValidator");
const {
  loginValidator,
} = require("../../middlewares/Validators/LoginValidator");
const {
  paymentValidator,
} = require("../../middlewares/Validators/paymentValidator");
const {
  creditTransactionValidator,
} = require("../../middlewares/Validators/TransactionValidator");
const { CancleDeposit } = require("../../middlewares/Validators/CancleDeposit");
const refreshToken = require("../../middlewares/JWT-refresh");
const { resetPassword } = require("../../middlewares/Validators/resetPassword");

// service bind to schema section

const SignupService = new SignUpService(User);
const Loginservice = new LoginService(User);
const forgotPasswordService = new ForgotPasswordService(User);
const dashboardService = new DashBoardService({
  WalletModel: WalletSchema,
  TransactionModel: TransactionSchema,
  InvestmentModel: InvestmentSchema,
  UserModel: User,
});
const paymentService = new WalletService({
  WalletModel: WalletSchema,
  TransactionModel: TransactionSchema,
  AdminTransactionModel: AdminTransactionSchema,
});

const investmentService = new InvestmentService({
  InvestmentModel: InvestmentSchema,
  WalletModel: WalletSchema,
});

const cryptoWalletService = new CryptoWalletService(CryptoWalletSchema);

// controller bind to service section
const SignupController = new SignUpController(SignupService);
const Logincontroller = new LoginController(Loginservice);
const forgotPasswordController = new ForgotPasswordController(
  forgotPasswordService
);
const DashBoardController = new DashBoardContr(dashboardService);
const payment = new Payment(paymentService);
const investmentController = new InvestmentContr(investmentService);
const cryptoWalletController = new CryptoWalletContr(cryptoWalletService);

// router sections
Router.post(
  "/signup",
  registerValidator,
  validate,
  Require_Api_key,
  SignupController.signUp
);
Router.post(
  "/login",
  loginValidator,
  validate,
  Require_Api_key,
  Logincontroller.login
);

Router.post(
  "/forgotPassword",
  Require_Api_key,
  forgotPasswordController.forgotPassword
);

Router.post("/verifyOtp", Require_Api_key, forgotPasswordController.verifyOtp);

Router.post(
  "/resetPassword",
  resetPassword,
  validate,
  Require_Api_key,
  forgotPasswordController.resetPassword
);

Router.get(
  "/dashboard",
  Require_Api_key,
  Require_jwt_key,
  DashBoardController.getDashboard
);

Router.post(
  "/payment",
  paymentValidator,
  validate,
  Require_Api_key,
  Require_jwt_key,
  payment.requestDeposit
);

Router.post(
  "/invest",
  Require_Api_key,
  investmentValidator,
  validate,
  Require_jwt_key,
  investmentController.invest
);

cron.schedule("*/2 * * * * *", () => {
  investmentController.processDailyROI();
});

Router.post("/refreshToken", Require_Api_key, refreshToken);

Router.get(
  "/getWallets",
  Require_Api_key,
  Require_jwt_key,
  cryptoWalletController.getCryptoWallet
);

// admin section
Router.get(
  "/Transactions",
  Require_Api_key,
  Require_jwt_key,
  payment.AdminGetTransaction
);

Router.post(
  "/addWallet",
  Require_Api_key,
  Require_jwt_key,
  cryptoWalletController.UpdateCryptoWallet
);

Router.post(
  "/deleteWallet",
  Require_Api_key,
  Require_jwt_key,
  cryptoWalletController.DeleteCryptoWallet
);

Router.post(
  "/confirmDeposit",
  creditTransactionValidator,
  validate,
  Require_Api_key,
  Require_jwt_key,
  payment.confirmDeposit
);

Router.post(
  "/cancleDeposit",
  CancleDeposit,
  validate,
  Require_Api_key,
  Require_jwt_key,
  payment.cancleDeposit
);
// admin section
module.exports = Router;
