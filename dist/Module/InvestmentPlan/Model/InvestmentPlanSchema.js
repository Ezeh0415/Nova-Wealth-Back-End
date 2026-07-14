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
exports.InvestmentPlan = exports.PlanIconName = void 0;
// investmentPlan.schema.ts
const mongoose_1 = __importStar(require("mongoose"));
// ==================== ENUMS ====================
var PlanIconName;
(function (PlanIconName) {
    PlanIconName["STAR_OUTLINED"] = "StarOutlined";
    PlanIconName["BAR_CHART_OUTLINED"] = "BarChartOutlined";
    PlanIconName["TROPHY_OUTLINED"] = "TrophyOutlined";
    PlanIconName["ROCKET_OUTLINED"] = "RocketOutlined";
})(PlanIconName || (exports.PlanIconName = PlanIconName = {}));
// ==================== SCHEMA ====================
const InvestmentPlanSchema = new mongoose_1.Schema({
    planId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, "Plan name is required"],
        trim: true,
        index: true,
    },
    minAmount: {
        type: Number,
        required: [true, "Minimum amount is required"],
        min: [0, "Minimum amount cannot be negative"],
    },
    maxAmount: {
        type: Number,
        required: [true, "Maximum amount is required"],
        min: [0, "Maximum amount cannot be negative"],
    },
    roi: {
        type: Number,
        required: [true, "ROI percentage is required"],
        min: [0, "ROI cannot be negative"],
        max: [100, "ROI cannot exceed 100%"],
    },
    duration: {
        type: Number,
        required: [true, "Duration is required"],
        min: [1, "Duration must be at least 1 day"],
    },
    color: {
        type: String,
        required: [true, "Color code is required"],
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"],
    },
    iconName: {
        type: String,
        required: [true, "Icon name is required"],
        enum: {
            values: Object.values(PlanIconName),
            message: "{VALUE} is not a valid icon",
        },
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"],
    },
    features: [
        {
            type: String,
            trim: true,
        },
    ],
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    order: {
        type: Number,
        default: 0,
        index: true,
    },
}, {
    timestamps: true,
});
// ==================== INDEXES ====================
// Compound indexes for common queries
InvestmentPlanSchema.index({ isActive: 1, order: 1 });
InvestmentPlanSchema.index({ isActive: 1, minAmount: 1 });
InvestmentPlanSchema.index({ isActive: 1, duration: 1 });
// ==================== VIRTUALS ====================
// Get expected returns based on amount
InvestmentPlanSchema.virtual("calculateReturns").get(function () {
    return (amount) => {
        if (amount < this.minAmount || amount > this.maxAmount) {
            return null;
        }
        return amount * (1 + this.roi / 100);
    };
});
// Get profit amount
InvestmentPlanSchema.virtual("profitPercentage").get(function () {
    return this.roi;
});
// ==================== METHODS ====================
// Check if amount is within plan range
InvestmentPlanSchema.methods.isAmountValid = function (amount) {
    return amount >= this.minAmount && amount <= this.maxAmount;
};
// Get plan details for display
InvestmentPlanSchema.methods.getDisplayDetails = function () {
    return {
        id: this._id,
        planId: this.planId,
        name: this.name,
        minAmount: this.minAmount,
        maxAmount: this.maxAmount,
        roi: this.roi,
        duration: this.duration,
        color: this.color,
        iconName: this.iconName,
        description: this.description,
        features: this.features,
        isActive: this.isActive,
        order: this.order,
    };
};
// ==================== STATIC METHODS ====================
// Get all active plans sorted by order
InvestmentPlanSchema.statics.getActivePlans = function () {
    return this.find({ isActive: true }).sort({ order: 1 });
};
// Get plan by planId
InvestmentPlanSchema.statics.getPlanById = function (planId) {
    return this.findOne({ planId, isActive: true });
};
// Get plans within amount range
InvestmentPlanSchema.statics.getPlansByAmount = function (amount) {
    return this.find({
        isActive: true,
        minAmount: { $lte: amount },
        maxAmount: { $gte: amount },
    }).sort({ order: 1 });
};
// Get plan statistics
InvestmentPlanSchema.statics.getPlanStats = function () {
    return this.aggregate([
        {
            $group: {
                _id: null,
                totalPlans: { $sum: 1 },
                activePlans: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
                avgMinAmount: { $avg: "$minAmount" },
                avgMaxAmount: { $avg: "$maxAmount" },
                avgRoi: { $avg: "$roi" },
            }
        },
    ]);
};
exports.InvestmentPlan = mongoose_1.default.model("InvestmentPlan", InvestmentPlanSchema);
exports.default = exports.InvestmentPlan;
