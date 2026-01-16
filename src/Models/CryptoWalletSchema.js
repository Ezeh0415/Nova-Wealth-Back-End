const mongoose = require("mongoose");

const CryptoSchema = new mongoose.Schema(
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

module.exports = mongoose.model("CryptoWallet", CryptoSchema);
