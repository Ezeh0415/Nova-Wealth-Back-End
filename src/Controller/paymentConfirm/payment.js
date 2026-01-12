class Payment {
  constructor(Transaction) {
    this.Transaction = Transaction;

    // bind this
    this.requestDeposit = this.requestDeposit.bind(this);
    this.AdminGetTransaction = this.AdminGetTransaction.bind(this);
    this.confirmDeposit = this.confirmDeposit.bind(this);
    this.cancleDeposit = this.cancleDeposit.bind(this);
  }

  async requestDeposit(req, res) {
    const { amount, paymentType } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const currency = paymentType;

    try {
      const data = await this.Transaction.requestDeposit(
        req.user.id,
        amount,
        currency
      );
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async AdminGetTransaction(req, res) {
    const { page, limit } = req.query;

    try {
      const data = await this.Transaction.AdminGetTransaction(page, limit);
      return res.status(200).json(data);
    } catch (err) {
      return res;
    }
  }

  async confirmDeposit(req, res) {
    const { userId, creditedAmount, transactionId } = req.body;

    if (!userId || !creditedAmount || !transactionId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const data = await this.Transaction.confirmDeposit(
        userId,
        creditedAmount,
        transactionId
      );
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async cancleDeposit(req, res) {
    const { userId, transactionId } = req.body;

    if (!userId || !transactionId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const data = await this.Transaction.cancleDeposit(userId, transactionId);
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}

module.exports = Payment;
