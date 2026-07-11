import mongoose, { Schema, Model, Document } from "mongoose";

// Base interface (without Mongoose specific fields)
export interface ICryptoWallet {
  cryptoName: string;
  cryptoAddress: string;
}

// Document interface (with Mongoose document properties)
interface ICryptoWalletDocument extends ICryptoWallet, Document {
  createdAt: Date;
  updatedAt: Date;
}

// Model interface (for static methods)
interface ICryptoWalletModel extends Model<ICryptoWalletDocument> {
  // Add custom static methods here if needed
}

const CryptoSchema = new Schema<ICryptoWalletDocument, ICryptoWalletModel>(
  {
    cryptoName: {
      type: String,
      required: true,
    },
    cryptoAddress: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const CryptoWallet = mongoose.model<ICryptoWalletDocument, ICryptoWalletModel>(
  "CryptoWallet",
  CryptoSchema
);

export default CryptoWallet;