import amqplib, { Connection } from 'amqplib';
import { RabbitMqQueues } from './rabbitmq-queues.enum';

class RabbitMqManageConnection {
    private CONNECTION: Connection;

    private async createConnection() {
        if (this.CONNECTION) return;
        this.CONNECTION = await amqplib.connect('amqp://localhost');
    }

    async createChannel(queueName: RabbitMqQueues, exclusive = false) {
        await this.createConnection();
        const channel = await this.CONNECTION.createChannel();
        await channel.assertQueue(queueName, { exclusive });
        return channel;
    }
    
    async closeConnection() {
        this.CONNECTION.close();
    }    
}

export default RabbitMqManageConnection;
