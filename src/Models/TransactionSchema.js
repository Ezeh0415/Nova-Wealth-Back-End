const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["deposit", "withdraw","investment", "profit"],
    required: true,
  },
  currency: { type: String, default: "USDT" },
  requestedAmount: { type: Number }, // what user requested
  creditedAmount: { type: Number }, // what admin actually credited
  status: { type: String, enum: ["canceled","pending", "completed"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", TransactionSchema);
