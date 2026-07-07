import User from "../../../Auth/Model/UserSchema";
import Investment from "../../../Investment/Model/InvestmentSchema";
import { NotificationModel } from "../../../Notification/NotificationSchema";
import TransactionModel from "../../../Transaction/Model/Client/TransactionSchema";
import Wallet from "../../../Wallet/WalletSchema";

export class ClientDashboard {
    private static instance: ClientDashboard;
    private user = User;
    private wallet = Wallet;
    private investment = Investment;
    private Transaction = TransactionModel;
    private Notification = NotificationModel;

    private constructor() { };

    public static getInstance(): ClientDashboard {
        if (!ClientDashboard.instance) {
            ClientDashboard.instance = new ClientDashboard();
        }
        return ClientDashboard.instance;
    }
}