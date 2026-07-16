"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateInvestPlan = void 0;
const zod_1 = __importDefault(require("zod"));
const InvestmentPlanSchema_1 = require("../Model/InvestmentPlanSchema");
exports.CreateInvestPlan = zod_1.default.object({
    planId: zod_1.default.string(),
    name: zod_1.default.string(),
    minAmount: zod_1.default.number(),
    maxAmount: zod_1.default.number(),
    roi: zod_1.default.number(),
    duration: zod_1.default.number(),
    color: zod_1.default.string(),
    iconName: zod_1.default.nativeEnum(InvestmentPlanSchema_1.PlanIconName),
    description: zod_1.default.string(),
    features: zod_1.default.array(zod_1.default.string()).min(1, "At least one feature is required").max(10, "Maximum 10 features allowed"),
    isActive: zod_1.default.boolean(),
    order: zod_1.default.number().optional(),
});
