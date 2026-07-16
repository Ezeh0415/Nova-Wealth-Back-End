"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentStatus = exports.PaymentType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var PaymentType;
(function (PaymentType) {
    PaymentType["DEPOSIT"] = "deposit";
    PaymentType["WITHDRAW"] = "withdraw";
    PaymentType["INVESTMENT"] = "investment";
    PaymentType["PROFIT"] = "profit";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["ACTIVE"] = "active";
    PaymentStatus["CANCELLED"] = "cancelled";
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["COMPLETED"] = "completed";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
const TransactionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    transactionId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User"
    },
    type: {
        type: String,
        enum: Object.values(PaymentType),
        required: true,
    },
    currency: { type: String, default: "USDT" },
    requestedAmount: { type: Number }, // what user requested
    creditedAmount: { type: Number }, // what admin actually credited
    status: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.PENDING,
    },
    createdAt: { type: Date, default: Date.now },
    userEmail: {
        type: String,
    },
    userFullName: { type: String },
    description: { type: String }
});
const TransactionModel = mongoose_1.default.model("Transaction", TransactionSchema);
exports.default = TransactionModel;
