const compression = require('compression');
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const Sentry = require('@sentry/node');

const { api } = require('./api');
const config = require('./config');
const { log } = require('./log');

const sentryConfig = config.get('sentry');
if (sentryConfig) {
    Sentry.init(sentryConfig);
}

const app = express();
if (sentryConfig) {
    app.use(Sentry.Handlers.requestHandler());
}
app.use(helmet(config.get('helmet')));
app.use(compression());

app.set('port', config.get('port'));
app.set('trust proxy', true);

const router = express();

const extraPath = process.env.API_PATH || config.get('api_path');

app.use(extraPath || '/', router);

if (extraPath !== '/') {
    app.get('/', (req, res, next) => {
        res.redirect(extraPath);
    });
}

router.use('/api', api);

const publicFolder = path.join(__dirname, config.get('dist'));

router.use('/', express.static(publicFolder));
router.use((req, res, next) => {
    res.sendFile(path.join(publicFolder, 'index.html'));
});

app.use((req, res, next) => {
    const error = new Error('NOT_FOUND');
    error.code = 404;
    next(error);
});

if (sentryConfig) {
    app.use(Sentry.Handlers.errorHandler());
}

app.use((err, req, res, next) => {
    if (!res.headersSent) {
        if (err.code) {
            // TODO: HACK FOR LOGIN!!!!
            // if (err.code === 400) {
            //     return res.status(200).send('400');
            // }

            log.warn(err.message);
            res.status(err.code).send(err.message);
        } else {
            if (err.sql) {
                log.error(err.original.message + ' at ' + err.sql);   
            } else {
                log.error(err.stack.split('\n').slice(0, 2).join(''));
            }

            if (err.message === 'Validation error') {
                res.status(409).send('Entity already exists.');
            } else {
                res.status(500).send('Something went wrong.');
            }
        }
    }
});

module.exports = app;
