const Router = require("express").Router();
const cron = require("node-cron");

// controller section
const SignUpController = require("../Controller/SignUpContr/SignUp");
const LoginController = require("../Controller/LoginContr/Login");
const DashBoardContr = require("../Controller/DashBoardContr/DashBoardContr");
const InvestmentContr = require("../Controller/InvestmentContr/Investment");

// service section
const SignUpService = require("../Service/SignUpService/SignUp");
const LoginService = require("../Service/LoginService/Login");
const DashBoardService = require("../Service/DashBoardService/DashBoardService");
const WalletService = require("../Service/TransactionService/Transaction");
const InvestmentService = require("../Service/InvestmentService/investment");

// schema section
const User = require("../Models/UserSchema");
const WalletSchema = require("../Models/WalletSchema");
const TransactionSchema = require("../Models/TransactionSchema");
const InvestmentSchema = require("../Models/InvestmentSchema");
const AdminTransactionSchema = require("../Models/AdminTransactionSchema");

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

// service bind to schema section

const SignupService = new SignUpService(User);
const Loginservice = new LoginService(User);
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

// controller bind to service section
const SignupController = new SignUpController(SignupService);
const Logincontroller = new LoginController(Loginservice);
const DashBoardController = new DashBoardContr(dashboardService);
const payment = new Payment(paymentService);
const investmentController = new InvestmentContr(investmentService);

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

// admin section
Router.get(
  "/Transactions",
  Require_Api_key,
  Require_jwt_key,
  payment.AdminGetTransaction
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
