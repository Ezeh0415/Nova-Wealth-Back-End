import z from "zod";

export const GetTransaction = z.object({
    page: z.number(),
    limit: z.number()
});