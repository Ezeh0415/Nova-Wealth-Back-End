import { Request, Response } from "express";
import { Authentication } from "../Service/Auth";
import { SignUp } from "../ZodValidation/Signup";

export class AuthContr {
    private static instance: AuthContr;
    private Authentication: Authentication;


    private constructor() {
        this.Authentication = Authentication.getInstance();
    };

    public static getInstance(): AuthContr {
        if (!AuthContr.instance) {
            AuthContr.instance = new AuthContr();
        }
        return AuthContr.instance;
    }

    async SignUp(req: Request, res: Response) {
        try {
            const validetedData = await SignUp.parse(req.body);
        } catch (error) {
            
        }
    }


}