"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class AppConfig {
    constructor() {
        this._port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
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
    get MJ_APIKEY_PUBLIC() {
        return this._MJ_APIKEY_PUBLIC;
    }
    get MJ_APIKEY_PRIVATE() {
        return this._MJ_APIKEY_PRIVATE;
    }
    get API_KEY() {
        return this._API_KEY;
    }
    get FRONTEND_URL() {
        return this._FRONTEND_URL;
    }
    get EMAIL_USER() {
        return this._EMAIL_USER;
    }
    get ADMIN_EMAIL_USER() {
        return this._ADMIN_EMAIL_USER;
    }
}
exports.AppConfig = AppConfig;
exports.default = AppConfig.getInstance();
