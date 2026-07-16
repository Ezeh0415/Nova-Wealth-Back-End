"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmDeposit = void 0;
const zod_1 = __importDefault(require("zod"));
exports.confirmDeposit = zod_1.default.object({
    userId: zod_1.default.string(),
    transactionId: zod_1.default.string(),
});
