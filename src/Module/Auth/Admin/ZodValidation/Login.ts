import z from "zod";

export const Login = z.object({
    email: z.string().email(),
    password: z.string()
})