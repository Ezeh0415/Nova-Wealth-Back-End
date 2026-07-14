"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignUp = void 0;
const zod_1 = require("zod");
exports.SignUp = zod_1.z.object({
    fullName: zod_1.z.string().min(2, "Full Name Must Be At Least 2 Characters").max(50),
    userName: zod_1.z.string().min(2, "UserName Must Be At Least 2 Characters ").max(50),
    email: zod_1.z.string(),
    password: zod_1.z.string()
        .min(6, "Password must be at least 6 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    referral: zod_1.z.string().optional()
});
