"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfig = void 0;
class AppConfig {
    constructor() {
        this._port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
        this._JWT_SECRET_KEY = process.env.JWT_SECRET_KEY ?? '';
        this._JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "";
        this._JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "";
        this._JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "";
    }
    static getInstance() {
        if (!AppConfig.instance) {
            AppConfig.instance = new AppConfig();
        }
        return AppConfig.instance;
    }
    get port() {
        return this._port;
    }
    get JWT_SECRET_KEY() {
        return this._JWT_SECRET_KEY;
    }
    get JWT_REFRESH_SECRET() {
        return this._JWT_REFRESH_SECRET;
    }
    get JWT_ACCESS_EXPIRES_IN() {
        return this._JWT_ACCESS_EXPIRES_IN;
    }
    get JWT_REFRESH_EXPIRES_IN() {
        return this._JWT_REFRESH_EXPIRES_IN;
    }
}
exports.AppConfig = AppConfig;
exports.default = AppConfig.getInstance();
