import z from "zod";

export const createCryptoWallet = z.object({
    cryptoName: z.string(),
    cryptoAddress: z.string()
})

export const updateCryptoWallet = z.object({
    userId: z.string(),
    cryptoAddress: z.string()
})

export const deleteCryptoWallet = z.object({
    userId: z.string(),
})