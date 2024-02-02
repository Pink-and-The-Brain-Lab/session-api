import authConfig from '../config/auth';
import { sign } from "jsonwebtoken";
import UserSession from "../models/user-session.model";
import { RabbitMqQueues } from "../enums/rabbitmq-queues.enum";
import { Channel, ConsumeMessage } from "amqplib";
import { IRabbitQueueContent } from "./interfaces/rabbit-queue-content.inteface";
import { responseRabbitQueue } from "./interfaces/response-rabbit-queue.type";
import { IValidationTokenData } from "./interfaces/validation-token-data.interface";
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { IErrorMessage } from "../errors/error-message.interface";
import RabbitMqManageConnection from 'millez-lib-api/src/rabbitMQ-manage-connection/RabbitMqManageConnection';

class RabbitMqListener {
    private rabbitmq: RabbitMqManageConnection;

    async listeners(): Promise<void> {
        this.rabbitmq = new RabbitMqManageConnection('amqp://localhost');
        this.createSessionListener();
        this.validateSessionListener();
    }

    private async createSessionListener(): Promise<void> {
        const channel = await this.rabbitmq.createChannel(RabbitMqQueues.CREATE_SESSION);
        channel.consume(RabbitMqQueues.CREATE_SESSION, async (message: ConsumeMessage | null) => {
            if (!message) return;
            const content: IRabbitQueueContent = JSON.parse(message.content.toString()).data;
            let response: IValidationTokenData | IErrorMessage = await this.createToken(content.userId, content.keepLoggedIn);
            this.rabbitQueueResponse(channel, message, response);
            channel.ack(message);
        });
    }

    private async validateSessionListener(): Promise<void> {
        const channel = await this.rabbitmq.createChannel(RabbitMqQueues.VALIDATE_SESSION);
        channel.consume(RabbitMqQueues.VALIDATE_SESSION, async (message: ConsumeMessage | null) => {
            if (!message) return;
            const content: string = JSON.parse(message.content.toString()).data;
            let response: any = await this.validateSession(content || '');
            this.rabbitQueueResponse(channel, message, response );
            channel.ack(message);
        });
    }

    private rabbitQueueResponse(channel: Channel, message: ConsumeMessage, response: responseRabbitQueue): void {
        const correlationId = message.properties.correlationId;
        const replyTo = message.properties.replyTo;
        channel.sendToQueue(
            replyTo,
            Buffer.from(JSON.stringify(response)),
            { correlationId }
        );
    }

    private async createToken(userId: string, keepLoggedIn: boolean): Promise<IValidationTokenData | IErrorMessage> {
        try {
            const { secret, expiresIn } = authConfig.jwt;
            const tokenConfig = keepLoggedIn ? { subject: userId } : { subject: userId, expiresIn };
            const token = sign({}, secret, tokenConfig);

            const userSession = new UserSession({ userId, token, keepLoggedIn });
            await userSession.save();
            return { token };
        } catch (error) {
            return error as IErrorMessage;
        }
    }

    private validateSession(token: string) {
        const secret = process.env.JWT_SECRET || '';
        return jwt.verify(token, secret, (error: any, decoded: any) => ({
            ...decoded,
            expiredAt: error?.expiredAt
        }));
    }

    // TODOOOOOOOOOOOOOOO
    
    // EXAMPLE HOW TO GET TOKEN IN A REQUEST
    // function checkToken(request: Request, response: Response, next: NextFunction) {
        //     const authHeader = request.headers.get('authorization');
        //     const token = authHeader && authHeader.split(' ')[1];
        //     if (!token) throw new AppError('API_ERRORS.NOT_ALLOWED', 401);

        //     try {
        //         const secret = process.env.JWT_SECRET || '';
        //         jwt.verify(token, secret);
        //         next();
        //     } catch {
        //         throw new AppError('API_ERRORS.ACCESS_EXPIRED', 400);
        //     }
        // }

    // EXAMPLE HOW TO SEND TOKEN TO SESSION API
    // async teste() {
    //     const rabbitMqService = new RabbitMqMessagesProducerService();
    //     const tokenApiResponse = await rabbitMqService.sendDataToAPI<string>(
    //         'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MDY2NjYyNTUsImV4cCI6MTcwNjY2NjI1Niwic3ViIjoiZTM3YjhmMmMtYTRkMy00MDE1LTljN2UtMjkzM2Q1MzhhNzg5In0.koRjL1ISA4Vd6WXYy5QPMCN--G0TvTW4_gevuCnYsCw',
    //         RabbitMqQueues.VALIDATE_SESSION
    //     );

    //     console.log(tokenApiResponse)
        
        // RETURN WHEN TOKEN IS VALID
        // in front-end creat an http interceptor to get response and use this exp value and to create an alert to user refresh their session
        // {
        //     iat: 1706665124,
        //     exp: 1706751524,
        //     sub: 'e37b8f2c-a4d3-4015-9c7e-2933d538a789'
        //   }

        // RETURN WHEN TOKEN IS INVALID
        // { expiredAt: '2024-01-31T01:57:36.000Z' }
    // }
  
};

export default RabbitMqListener;
