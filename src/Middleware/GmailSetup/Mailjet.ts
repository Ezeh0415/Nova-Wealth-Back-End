import Mailjet from "node-mailjet";
import { AppConfig } from "../../config/Config";

export class MailSender {
    private static instance: MailSender;
    private config: AppConfig;

    public constructor() {
        this.config = AppConfig.getInstance();

    }

    public static getInstance(): MailSender {
        if (!MailSender.instance) {
            MailSender.instance = new MailSender();
        }
        return MailSender.instance;
    }

    public async mailjet() {
        const mailjet = Mailjet.apiConnect(
            this.config.MJ_APIKEY_PUBLIC,
            this.config.MJ_APIKEY_PRIVATE,
        )

        mailjet
            .get("user")
            .request()
            .then(() => {
                console.log("Mail server is ready - Connected successfully")
            })
            .catch((error) => {
                console.error("Mail server error:", error.statusCode, error.message)
            })
    }
}