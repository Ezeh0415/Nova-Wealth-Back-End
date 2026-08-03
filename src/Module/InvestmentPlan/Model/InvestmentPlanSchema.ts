// investmentPlan.schema.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== ENUMS ====================
export enum PlanIconName {
    STAR_OUTLINED = "StarOutlined",
    BAR_CHART_OUTLINED = "BarChartOutlined",
    TROPHY_OUTLINED = "TrophyOutlined",
    ROCKET_OUTLINED = "RocketOutlined",
    GOLD_OUTLINED = "GoldOutlined"
}

// ==================== INTERFACE ====================
export interface IInvestmentPlan extends Document {
    planId: string;
    name: string;
    minAmount: number;
    maxAmount: number;
    roi: number;
    duration: number;
    color: string;
    iconName: PlanIconName;
    description: string;
    features: string[];
    isActive: boolean;
    order?: number | undefined;
}

// ==================== SCHEMA ====================
const InvestmentPlanSchema = new Schema<IInvestmentPlan>(
    {
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
    },
    {
        timestamps: true,
    }
);

// ==================== INDEXES ====================
// Compound indexes for common queries
InvestmentPlanSchema.index({ isActive: 1, order: 1 });
InvestmentPlanSchema.index({ isActive: 1, minAmount: 1 });
InvestmentPlanSchema.index({ isActive: 1, duration: 1 });

// ==================== VIRTUALS ====================
// Get expected returns based on amount
InvestmentPlanSchema.virtual("calculateReturns").get(function (this: IInvestmentPlan) {
    return (amount: number) => {
        if (amount < this.minAmount || amount > this.maxAmount) {
            return null;
        }
        return amount * (1 + this.roi / 100);
    };
});

// Get profit amount
InvestmentPlanSchema.virtual("profitPercentage").get(function (this: IInvestmentPlan) {
    return this.roi;
});

// ==================== METHODS ====================
// Check if amount is within plan range
InvestmentPlanSchema.methods.isAmountValid = function (this: IInvestmentPlan, amount: number): boolean {
    return amount >= this.minAmount && amount <= this.maxAmount;
};

// Get plan details for display
InvestmentPlanSchema.methods.getDisplayDetails = function (this: IInvestmentPlan) {
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
InvestmentPlanSchema.statics.getPlanById = function (planId: string) {
    return this.findOne({ planId, isActive: true });
};

// Get plans within amount range
InvestmentPlanSchema.statics.getPlansByAmount = function (amount: number) {
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

// ==================== MIDDLEWARE ====================
// Pre-save middleware


// ==================== MODEL ====================
interface InvestmentPlanModel extends Model<IInvestmentPlan> {
    getActivePlans(): Promise<IInvestmentPlan[]>;
    getPlanById(planId: string): Promise<IInvestmentPlan | null>;
    getPlansByAmount(amount: number): Promise<IInvestmentPlan[]>;
    getPlanStats(): Promise<any[]>;
}

export const InvestmentPlan = mongoose.model<IInvestmentPlan, InvestmentPlanModel>(
    "InvestmentPlan",
    InvestmentPlanSchema
);

export default InvestmentPlan;