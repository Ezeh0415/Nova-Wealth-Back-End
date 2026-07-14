"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invest = void 0;
const zod_1 = __importDefault(require("zod"));
exports.Invest = zod_1.default.object({
    amount: zod_1.default.number().min(10, "Amount must be at least $10"),
    investmentType: zod_1.default.string(),
});
