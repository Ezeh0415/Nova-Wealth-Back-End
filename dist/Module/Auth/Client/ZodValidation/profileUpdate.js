"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileUpdate = void 0;
const zod_1 = __importDefault(require("zod"));
exports.profileUpdate = zod_1.default.object({
    userId: zod_1.default.string().optional(),
    fullName: zod_1.default.string().min(2, "Full name must be at least 2 characters"),
    email: zod_1.default.string().email("Email not valid"),
    currentPassword: zod_1.default.string().optional(),
    newPassword: zod_1.default.string().optional(),
    bitcoin: zod_1.default.string()
        .optional()
        .or(zod_1.default.literal('')), // Allow empty string
    usdt: zod_1.default.string()
        .optional()
        .or(zod_1.default.literal('')), // Allow empty string
    ethereum: zod_1.default.string()
        .optional()
        .or(zod_1.default.literal('')), // Allow empty string
    tron: zod_1.default.string()
        .optional()
        .or(zod_1.default.literal('')), // Allow empty string
});
