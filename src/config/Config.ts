export class AppConfig {
    private static instance: AppConfig;
    private _port: number;
    private _JWT_SECRET_KEY: string;
    private _JWT_REFRESH_SECRET: string;
    private _JWT_ACCESS_EXPIRES_IN: string;
    private _JWT_REFRESH_EXPIRES_IN: string;
    private _MJ_APIKEY_PUBLIC: string;
    private _MJ_APIKEY_PRIVATE: string;
    private _API_KEY: string;
    private _FRONTEND_URL: string;
    private _EMAIL_USER: string;
    private _ADMIN_EMAIL_USER: string;

    private constructor() {
        this._port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
        this._JWT_SECRET_KEY = process.env.JWT_SECRET_KEY ?? '';
        this._JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "";
        this._JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "";
        this._JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "";
        this._MJ_APIKEY_PUBLIC = process.env.MJ_APIKEY_PUBLIC ?? "";
        this._MJ_APIKEY_PRIVATE = process.env.MJ_APIKEY_PRIVATE ?? "";
        this._API_KEY = process.env.API_KEY ?? "";
        this._FRONTEND_URL = process.env.FRONTEND_URL ?? "";
        this._EMAIL_USER = process.env.EMAIL_USER ?? "";
        this._ADMIN_EMAIL_USER = process.env.ADMIN_EMAIL_USER ?? "";
    }

    public static getInstance(): AppConfig {
        if (!AppConfig.instance) {
            AppConfig.instance = new AppConfig();
        }
        return AppConfig.instance;
    }

    public get port(): number {
        return this._port;
    }

    public get JWT_SECRET_KEY(): string {
        return this._JWT_SECRET_KEY;
    }

    public get JWT_REFRESH_SECRET(): string {
        return this._JWT_REFRESH_SECRET;
    }

    public get JWT_ACCESS_EXPIRES_IN(): string {
        return this._JWT_ACCESS_EXPIRES_IN;
    }

    public get JWT_REFRESH_EXPIRES_IN(): string {
        return this._JWT_REFRESH_EXPIRES_IN;
    }

    public get MJ_APIKEY_PUBLIC(): string {
        return this._MJ_APIKEY_PUBLIC;
    }

    public get MJ_APIKEY_PRIVATE(): string {
        return this._MJ_APIKEY_PRIVATE;
    }

    public get API_KEY(): string {
        return this._API_KEY;
    }

    public get FRONTEND_URL(): string {
        return this._FRONTEND_URL;
    }

    public get EMAIL_USER(): string {
        return this._EMAIL_USER;
    }

    public get ADMIN_EMAIL_USER(): string {
        return this._ADMIN_EMAIL_USER;
    }
}

export default AppConfig.getInstance();