class ReferralContr {
  constructor(ReferralService) {
    this.referralService = ReferralService;

    // Bind methods to maintain 'this' context
    this.createReferralLink = this.createReferralLink.bind(this);
  }

  async createReferralLink(req, res) {
    try {
      const userId = req.user.id;
      const result = await this.referralService.createReferralLink(userId);
      res.status(201).json({
        success: true,
        message: "Referral link created successfully",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create referral link",
      });
    }
  }
}

module.exports = ReferralContr;
