import { NextFunction, Request, Response } from "express";
import AppError from './AppError';

const clientErrorHandle = (error: Error, request: Request, response: Response, next: NextFunction) => {
    if (error instanceof AppError) {
        return response.status(error.statusCode).json({
            status: 'Error',
            message: error.message
        });
    }

    return response.status(500).json({
        status: 'Error',
        message: error.message || 'API_ERRORS.INTERNAL_SERVER_ERROR'
    });
};

export default clientErrorHandle;
