const express = require('express');
const bodyParser = require ('body-parser');
const cors = require('cors');
require('express-async-errors');
const morgan = require('morgan');
const Redis = require('ioredis');
const Session = require('express-session');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const RedisStore = require('connect-redis')(Session);
const fs = require('fs');
const path = require('path');

const config = require('./config');
const models = require('./db').default;
const { log } = require('./log');

const redis = new Redis(config.get('redis'));

Promise.all([
    models.country.findOne(),
    redis.ping()
        .then((pong) => {
            if (pong !== 'PONG') {
                throw new Error('Redis fail');
            }
        }),
])
    .catch((error) => {
        log.error(error.message);
        throw error;
    });

const app = express();

app.use(bodyParser.json({limit: '3mb'}));
app.use(fileUpload({ useTempFiles : true }));

app.set('config', config.load());

app.use(cookieParser());

app.use(cors(config.get('cors')));

const cookieSchoolKey = 'schoolId';

morgan.token('schoolId', req => req.cookies[cookieSchoolKey]);
morgan.token('userId', req => req.user && req.user.id);

app.use(morgan(config.get('morgan') || 'dev', { stream: { write: log.info } }));
app.use(express.json());
const expressSession = Session(
    Object.assign(
        {
            store: new RedisStore(
                Object.assign(
                    {
                        client: redis,
                    },
                    config.get('connect-redis'),
                ),
            ),
        },
        config.get('express-session'),
    ),
);

app.use(expressSession);

app.use((req, res, next) => {
    if (!req.session) {
        throw new Error('No session');
    }

    next();
});

require('./routes/health').default(app, models, redis);
require('./routes/auth').default(app, models);

const cityC = new (require('./controllers/cities').default)();
const schoolsC = new (require('./controllers/schools').default)();

cityC.mount(app);
schoolsC.mount(app);

app.use(async (req, res, next) => {
    if (!req.user.school) {
        const error = new Error('You have no access to this Institution, please change your Institution.');
        error.code = 412;
        throw error;
    }

    next();
});

fs.readdirSync('routes')
    .map(filename => path.parse(filename).name)
    .forEach(filename => require(`./routes/${filename}`).default(app, models, redis));


fs.readdirSync('controllers')
    .map(filename => path.parse(filename).name)
    .map((filename) => {
        const Controller = require(`./controllers/${filename}`).default;
        const controller = new Controller();
        controller.mount(app);
    });

app.use((req, res, next) => {
    const error = new Error('NOT_FOUND');
    error.code = 404;
    next(error);
});

module.exports = { api: app, session: expressSession};
