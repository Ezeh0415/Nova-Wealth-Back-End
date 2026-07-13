import z from "zod";

export const Invest = z.object({
    amount:z.number().min(10, "Amount must be at least $10"),
    investmentType:z.string(),
})