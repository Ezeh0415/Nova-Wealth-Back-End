import CryptoWallet, { ICryptoWallet } from "../Model/CryptoSchema";

interface IWalletUpdate {
    userId: string,
    cryptoAddress: string
}

interface IDeleteWallet {
    userId: string
}

export class CryptoWalletService {
    private static instance: CryptoWalletService;
    private CryptoWallet = CryptoWallet;

    private constructor() { }

    public static getInstance(): CryptoWalletService {
        if (!CryptoWalletService.instance) {
            CryptoWalletService.instance = new CryptoWalletService();
        }

        return CryptoWalletService.instance;
    }

    public async getCryptoWallets() {
        try {
            const cryptoWallet = await this.CryptoWallet.find();

            return cryptoWallet;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to Get crypto wallets: ${error.message}`);
            }
            throw new Error('Failed to Get crypto wallets: Unknown error');
        }
    }

    public async createCryptoWallet(userData: ICryptoWallet) {
        try {
            const cryptoWallet = new this.CryptoWallet({
                cryptoName: userData.cryptoName.toUpperCase(), // Store in uppercase for consistency
                cryptoAddress: userData.cryptoAddress,
            })

            await cryptoWallet.save();

            return cryptoWallet;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to add crypto wallet: ${error.message}`);
            }
            throw new Error('Failed to Add crypto wallet: Unknown error');
        }
    }

    public async updateCryptoWallet(userData: IWalletUpdate) {
        try {
            const cryptoWallet = await this.CryptoWallet.findById(userData.userId);

            if (!cryptoWallet) {
                throw new Error("cryptoWallet Not Found");
            }

            const updated = await this.CryptoWallet.findByIdAndUpdate(
                userData.userId,
                {
                    $set: {
                        cryptoAddress: userData.cryptoAddress
                    }
                },
                { new: true }
            )

            return updated
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to Update crypto wallet: ${error.message}`);
            }
            throw new Error('Failed to Update crypto wallet: Unknown error');
        }
    }

    public async DeleteCryptoWallet(userData: IDeleteWallet) {
        try {
            const cryptoWallet = await this.CryptoWallet.findByIdAndDelete(userData.userId);
            if (!CryptoWallet) {
                throw new Error("CryptoWallet not found");
            }
            return cryptoWallet;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to Delete crypto wallet: ${error.message}`);
            }
            throw new Error('Failed to Delete crypto wallet: Unknown error');
        }
    }
}