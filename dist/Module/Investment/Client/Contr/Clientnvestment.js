"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientInvestmentContr = void 0;
const Invest_1 = require("../../ZodValidation/Invest");
const ZodError_1 = require("../../../../Utili/ZodError/ZodError");
const InvestmentClient_1 = require("../Service/InvestmentClient");
class ClientInvestmentContr {
    constructor() {
        this.ClientInvestment = InvestmentClient_1.ClientInvestment.getInstance();
    }
    ;
    static getInstance() {
        if (!ClientInvestmentContr.instance) {
            ClientInvestmentContr.instance = new ClientInvestmentContr();
        }
        return ClientInvestmentContr.instance;
    }
    async invest(req, res) {
        try {
            const validateData = Invest_1.Invest.parse(req.body);
            const userId = req.user.userId;
            if (!userId) {
                res
                    .status(400)
                    .json({ message: "Please provide all required fields" });
                return;
            }
            const Data = {
                userId: userId,
                amount: validateData.amount,
                investmentType: validateData.investmentType,
            };
            const investment = await this.ClientInvestment.invest(Data);
            res.status(200).json(investment);
            return;
        }
        catch (error) {
            if (ZodError_1.ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({
                success: false,
                message: 'internal server error',
                error: errorMessage,
            });
            return;
        }
    }
}
exports.ClientInvestmentContr = ClientInvestmentContr;
