import z from "zod";

export const Login = z.object({
    userName: z.string(),
    password: z.string()
})