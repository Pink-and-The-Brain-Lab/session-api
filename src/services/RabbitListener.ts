import 'dotenv/config';
import authConfig from '../config/auth';
import jwt, { sign } from "jsonwebtoken";
import UserSession from "../models/user-session.model";
import { RabbitMqQueues } from "../enums/rabbitmq-queues.enum";
import { IRabbitQueueContent } from "./interfaces/rabbit-queue-content.inteface";
import { IValidationTokenData } from "./interfaces/validation-token-data.interface";
import { AppError, RabbitMqListener, RabbitMqManageConnection } from 'millez-lib-api';
import { IJwtTokenValidation } from './interfaces/jwt-tokn-validation.interface';
import { RABBITMQ_HOST_URL } from '../constants/rabbitmq-host-url';

class RabbitListener {
    async listeners(): Promise<void> {
        const connection = new RabbitMqManageConnection(RABBITMQ_HOST_URL);
        const rabbitListener = new RabbitMqListener(connection);
        rabbitListener.genericListener<IValidationTokenData, IRabbitQueueContent>(RabbitMqQueues.CREATE_SESSION, this.createToken);
        rabbitListener.genericListener<IJwtTokenValidation | void, string>(RabbitMqQueues.VALIDATE_USER_SESSION, this.validateSession);
    }

    private async createToken({ userId, keepLoggedIn }: IRabbitQueueContent): Promise<IValidationTokenData> {
        const { secret, expiresIn } = authConfig.jwt;
        const tokenConfig = keepLoggedIn ? { subject: userId } : { subject: userId, expiresIn };
        const token = sign({}, secret, tokenConfig);
        const userSession = new UserSession({ userId, token, keepLoggedIn });
        await userSession.save();
        return { token };
    }

    private validateSession(token: string): IJwtTokenValidation | void {
        const secret = process.env.JWT_SECRET;
        if (!secret) return;
        return jwt.verify(token, secret, (error: any, decoded: any) => {
            if (error) throw new AppError(error, 401);
            return {
            ...decoded,
            expiredAt: decoded.exp
        }});
    } 
};

export default RabbitListener;
