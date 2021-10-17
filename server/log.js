const { createLogger, transports, format } = require('winston');
const fs = require('fs');
const path = require('path');

const logDir = 'logs';

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

exports.log = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
    ),
    transports: process.env.NODE_ENV === 'production' ? [
        new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
        new transports.File({ filename: path.join(logDir, 'access.log') }),
    ] : [
        new transports.Console(),
    ],
});

exports.rmqLog = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
    ),
    transports: process.env.NODE_ENV === 'production' ? [
        new transports.File({ filename: path.join(logDir, 'rmq_messages.log') }),
    ] : [
        new transports.Console(),
    ],
});

exports.socketLog = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
    ),
    transports: process.env.NODE_ENV === 'production' ? [
        new transports.File({ filename: path.join(logDir, 'socket.log') }),
    ] : [
        new transports.Console(),
    ],
});
