"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCryptoWallet = exports.updateCryptoWallet = exports.createCryptoWallet = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createCryptoWallet = zod_1.default.object({
    cryptoName: zod_1.default.string(),
    cryptoAddress: zod_1.default.string()
});
exports.updateCryptoWallet = zod_1.default.object({
    userId: zod_1.default.string(),
    cryptoAddress: zod_1.default.string()
});
exports.deleteCryptoWallet = zod_1.default.object({
    userId: zod_1.default.string(),
});
