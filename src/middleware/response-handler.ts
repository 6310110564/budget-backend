import { Request, Response, NextFunction } from 'express';

declare global {
    namespace Express {
        interface Response {
            ok(data: any): void;
            custom(options: { data?: any; message: string; statusCode?: number }): void;
            error(options: { message: string; statusCode?: number; details?: any }): void;
            created(data: any): void;
            noContent(): void;
            badRequest(message: string, details?: any): void;
            unauthorized(message: string, details?: any): void;
            forbidden(message: string, details?: any): void;
            notFound(message: string, details?: any): void;
        }
    }
}
export const responseHandlerMiddleware = (req: Request, res: Response, next: NextFunction) => {

    res.custom = function ({ data, message, statusCode = 200 }) {
        const response = {
            success: true,
            code: statusCode,
            message,
            results: data
        }

        return this.status(statusCode).json(response);
    };

    // status code 2xx
    res.ok = function (data: Record<string, any>) {
        const response = {
            success: true,
            code: 200,
            ...data
        }

        return this.status(200).json(response);
    };

    res.created = function (data: Record<string, any>) {
        const response = {
            success: true,
            code: 201,
            ...data
        }

        return this.status(201).json(response);
    }

    res.noContent = function () {
        return this.status(204).send();
    }


    // status code 4xx
    res.badRequest = function (message: string, details?: any) {
        const response = {
            success: false,
            code: 400,
            message,
            details
        }

        return this.status(400).json(response);
    }

    res.unauthorized = function (message: string, details?: any) {
        const response = {
            success: false,
            code: 401,
            message,
            details
        }   

        return this.status(401).json(response);
    }

    res.forbidden = function (message: string, details?: any) {
        const response = {
            success: false,
            code: 403,
            message,
            details
        }   

        return this.status(403).json(response);
    }

    res.notFound = function (message: string, details?: any) {
        const response = {
            success: false, 
            code: 404,
            message,
            details
        }

        return this.status(404).json(response);
    }
    
    res.error = function ({ message, statusCode, details }) {
        const response = {
            success: false,
            code: statusCode ?? 500,
            message,
            details
        }

        return this.status(statusCode ?? 500).json(response);
    };

    next();
};
