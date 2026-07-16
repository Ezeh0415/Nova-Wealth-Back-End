import z from "zod";

export const GetTransaction = z.object({
    page: z.coerce.number(),
    limit: z.coerce.number()
});