import z from "zod";

export const userDeposit = z.object({
    amount: z.coerce.number(),
    paymentType: z.string()
})