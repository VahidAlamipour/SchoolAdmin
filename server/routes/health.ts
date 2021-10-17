import {Application, Router} from 'express';
const p = require('../package.json');

export default (app: Application) => {
    const router: Router = Router();

    app.use('/health', router);

    app.get('/version', (req, res, next) => {
        res.json(`${p.version}`);
    });

    router.use(async (req, res, next) => {
        res.json({
            version: p.version,
            'redis': 'OK',
            'db': 'OK',
            'session': 'OK'
        });
    });
};
