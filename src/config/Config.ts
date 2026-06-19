export class AppConfig {
    private static instance: AppConfig;
    private _port: number;
    private _JWT_SECRET_KEY: string;
    private _JWT_REFRESH_SECRET: string;
    private _JWT_ACCESS_EXPIRES_IN: string;
    private _JWT_REFRESH_EXPIRES_IN:string

    private constructor() {
        this._port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
        this._JWT_SECRET_KEY = process.env.JWT_SECRET_KEY ?? '';
        this._JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "";
        this._JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "";
        this._JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "";
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
}

export default AppConfig.getInstance();