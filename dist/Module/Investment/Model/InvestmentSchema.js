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
exports.Investment = exports.InvestmentStatus = exports.InvestmentType = void 0;
// investment.schema.ts
const mongoose_1 = __importStar(require("mongoose"));
// ==================== ENUMS ====================
var InvestmentType;
(function (InvestmentType) {
    InvestmentType["BASIC"] = "basic";
    InvestmentType["STANDARD"] = "standard";
    InvestmentType["PREMIUM"] = "premium";
    InvestmentType["ULTIMATE"] = "ultimate";
    InvestmentType["PLATINUM"] = "platinum";
})(InvestmentType || (exports.InvestmentType = InvestmentType = {}));
var InvestmentStatus;
(function (InvestmentStatus) {
    InvestmentStatus["ACTIVE"] = "active";
    InvestmentStatus["PENDING"] = "pending";
    InvestmentStatus["COMPLETED"] = "completed";
    InvestmentStatus["CANCELLED"] = "cancelled";
})(InvestmentStatus || (exports.InvestmentStatus = InvestmentStatus = {}));
// ==================== SCHEMA ====================
const InvestmentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    roi: {
        type: Number,
        default: 0,
        min: 0,
    },
    TotalReturns: {
        type: Number,
        default: 0,
        min: 0,
    },
    lastRoiAt: {
        type: Date,
        default: null,
    },
    investmentType: {
        type: String,
        enum: Object.values(InvestmentType),
        required: true,
        index: true,
    },
    investmentStartDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    investmentEndDate: {
        type: Date,
        default: null,
    },
    description: {
        type: String,
        default: "",
    },
    investmentStatus: {
        type: String,
        enum: Object.values(InvestmentStatus),
        default: InvestmentStatus.PENDING,
        index: true,
    },
    cancelledAt: {
        type: Date,
    },
    uniqueId: { type: String },
}, {
    timestamps: true,
});
// ==================== INDEXES ====================
// Single field indexes
InvestmentSchema.index({ userId: 1 });
InvestmentSchema.index({ investmentType: 1 });
InvestmentSchema.index({ investmentStatus: 1 });
InvestmentSchema.index({ createdAt: -1 });
// Compound indexes for common queries
InvestmentSchema.index({ userId: 1, investmentStatus: 1 });
InvestmentSchema.index({ userId: 1, investmentType: 1 });
InvestmentSchema.index({ userId: 1, createdAt: -1 });
InvestmentSchema.index({ investmentStatus: 1, investmentType: 1 });
InvestmentSchema.index({ investmentStatus: 1, investmentEndDate: 1 });
// ==================== MODEL ====================
exports.Investment = mongoose_1.default.model("Investment", InvestmentSchema);
exports.default = exports.Investment;
