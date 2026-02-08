const mongoose = require("mongoose");

const investmentPlanSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
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
        values: [
          "StarOutlined",
          "BarChartOutlined",
          "TrophyOutlined",
          "RocketOutlined",
        ],
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
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const InvestmentPlan = mongoose.model("InvestmentPlan", investmentPlanSchema);

module.exports = InvestmentPlan;
