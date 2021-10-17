const amqplib = require('amqplib');
const { rmqLog: log } = require('../log');

class MessageQueue {
    constructor(connectString) {
        this.connectString = connectString;
        this.channel = null;
    }

    async getChannel() {
        if (this.channel) {
            return this.channel;
        }

        try {
            const connection = await amqplib.connect(this.connectString);

            connection.on('close', () => {
                log.error('Connection is closed');
                this.channel = null;
            });

            connection.on('error', () => {
                log.error('Connection is error');
                this.channel = null;
            });

            this.channel = await connection.createChannel();

            log.info('Connection is success');
            return this.channel
        } catch (err) {
            log.error(`Connection error: ${err}`);
            throw err
        }
    }

    toBuffer(payload) {
        return Buffer.from(JSON.stringify(payload));
    }

    fromBuffer(buffer) {
        return JSON.parse(buffer.toString());
    }

    emit(queue, payload, headers) {
        return this.getChannel()
            .then(channel => {
                channel.assertQueue(queue);
                return channel.sendToQueue(queue, this.toBuffer(payload), {
                    headers
                });
            });
    }

    on(queue, callback) {
        return this.getChannel()
            .then(channel => {
                channel.assertQueue(queue);
                return channel.consume(queue, (message) => {
                    return Promise.resolve(callback(this.fromBuffer(message.content)))
                        .then(() => channel.ack(message));
                });
            });
    }
}

exports.MessageQueue = MessageQueue;
