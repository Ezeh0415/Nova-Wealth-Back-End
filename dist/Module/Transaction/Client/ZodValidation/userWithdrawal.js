"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userWithdrawal = void 0;
const zod_1 = __importDefault(require("zod"));
exports.userWithdrawal = zod_1.default.object({
    amount: zod_1.default.number(),
    paymentType: zod_1.default.string(),
    walletAddress: zod_1.default.string(),
});
