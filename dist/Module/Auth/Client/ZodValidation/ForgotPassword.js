"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPassword = void 0;
const zod_1 = __importDefault(require("zod"));
exports.forgotPassword = zod_1.default.object({
    email: zod_1.default.string()
});
