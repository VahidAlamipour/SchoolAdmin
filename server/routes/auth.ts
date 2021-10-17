import { Application, Router, urlencoded, Request, Response, NextFunction } from 'express';
import { Issuer, Strategy as OpenIdStrategy } from 'openid-client';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

import { ITables } from '../models/db.tables';
import { format, format as formatURL } from 'url';
import * as path from 'path';
import { IProfile } from "../../sdk/interfaces";

const configAll = require('../config');

const logoutUrl = path.join(configAll.get('api_path'), configAll.get('auth:post_logout_redirect_uri'));
const loginUrl = path.join(configAll.get('api_path'), configAll.get('auth:redirect_uri'));

export default (app: Application, models: ITables) => {
    const router: Router = Router();

    const config = app.get('config').auth;
    const reqUserConfig = app.get('config').reqUserConfig;

    Issuer.defaultHttpOptions = config.http;

    const beedIssuer = new Issuer(config.issuer);
    const client = new beedIssuer.Client(config.client);

    client.CLOCK_TOLERANCE = 1200;

    passport.use('oidc', new OpenIdStrategy({
        client,
        params: config.request,
    }, (tokenSet, userInfo, done) => done(null, tokenSet)));

    passport.use('local', new LocalStrategy(async (email: string, password: string, done) => {
        return models.user.findOne({
            where: {
                email,
                disabled: 0
            }
        }).then(user => {
            if (user && user.external_id) {
                return done(null, {
                    claims: {
                        sub: user.external_id
                    }
                });
            } else {
                const error: any = new Error('User not found');
                error.code = 400;
                throw error;
            }
        }).catch(error => done(error, false));
    }));

    async function getMe(id: number): Promise<any> {
        const user: any = await models.user.findOne({
            where: {
                external_id: id,
            },
            include: [{
                required: false,
                model: models.user_role,
                where: {
                    disabled: 0,
                    archived: 0,
                },
                include: [{
                    model: models.role,
                    where: {
                        disabled: 0,
                    },
                }],
            }]
        });

        if (!user) {
            // const error: any = new Error(`User not found [${id}]`);
            // error.code = 400;
            // throw error;
            return {};
        }

        const interfacesList = !user.disabled ? await models.interface.findAll({
            include: [{
                model: models.interface_role,
                where: {
                    role_id: user.user_roles.map(row => row.role_id)
                }
            }],
            order: [
                ['code', 'ASC']
            ]
        }) : [];

        const adminRoles = user.user_roles.filter((userRole: any) => userRole.role.sub_code === 'ADMINISTRATOR');

        const adminSchools: Set<number> = new Set(adminRoles.map(({ school_id }) => school_id).filter(Boolean));
        const adminBranches: Set<number> = new Set(adminRoles.map(({ branch_id }) => branch_id).filter(Boolean));

        let allSchool: number[] = [...adminSchools];
        if (adminBranches && [...adminBranches].length > 0) {
            const tempSchools = await models.school.findAll({
                where: { branch_id: [...adminBranches], disabled: 0 },
                attributes: ['id']
            });
            if (tempSchools && tempSchools.length)
                allSchool = tempSchools.map(x => x.id);
        }


        return {
            id: user.id,
            oauthId: user.external_id,
            name: user.name,
            lastName: user.surname,
            middleName: user.middle_name,
            interfaces: interfacesList.reduce((hash, row) => ({
                ...hash,
                [row.code]: {
                    link: row.pass_through_auth_url,
                    showOnStart: Boolean(row.show_on_start),
                }
            }), {}),
            access: {
                isSuperAdmin: false,
                schoolsId: [...adminSchools],
                branchesId: [...adminBranches],
                allSchool: [...allSchool]
            },
            config: reqUserConfig
        };
    }

    passport.serializeUser((tokenSet: any, next) => {
        //To serialize data to store inside req.session.passport.user
        next(null, {
            id_token: tokenSet.id_token,
            sub: tokenSet.claims.sub,
            access_token: tokenSet.access_token
        });
    });

    passport.deserializeUser(async (tokenSet: any, next) => {
        try {
            const user = await getMe(tokenSet.sub);

            return next(null, user);
        } catch (e) {
            next(e);
        }

    });

    app.use(passport.initialize());
    app.use(passport.session());

    app.get('/login', (req, res): void => {
        res.redirect(formatURL({
            pathname: './v1/auth/external',
            query: req.query,
        }));
    });

    app.get('/logout', (req, res): void => {
        res.redirect('./v1/auth/logout');
    });

    app.use('/v1/auth', router);

    router.get('/external', (req: Request, res: Response, next: NextFunction): void => {
        req.session.return_url = req.query.return_url;

        passport.authenticate('oidc', {
            ...config.request_silent,
            redirect_uri: format({
                host: req.header('host'),
                protocol: req.header("x-forwarded-proto") || "http",
                pathname: loginUrl,
            }),
        })(req, res, next);
    });

    router.get('/external_form', (req: Request, res: Response, next: NextFunction): void => {
        req.session.return_url = req.query.return_url;

        passport.authenticate('oidc', {
            ...config.request_login,
            redirect_uri: format({
                host: req.header('host'),
                protocol: req.header("x-forwarded-proto") || "http",
                pathname: loginUrl,
            }),
        })(req, res, next);
    });

    router.use('/return', urlencoded({ extended: false }), (req, res, next): void => {
        passport.authenticate('oidc', {
            successRedirect: './success',
            failureRedirect: './failure',
            // @ts-ignore
            redirect_uri: format({
                host: req.header('host'),
                protocol: req.header("x-forwarded-proto") || "http",
                pathname: loginUrl,
            }),
        })(req, res, next);
    }, (err: Error, req: Request, res: Response, next: NextFunction): void => {
        if (err.message.includes('session')) {
            res.redirect('./failure');
        } else {
            next(err);
        }
    });

    if (config.fake) {
        router.get('/fake/:username', (req: Request, res: Response, next: NextFunction): void => {
            req.body = req.params;
            req.body.password = 'password';
            next();
        }, passport.authenticate('local', {
            successRedirect: '../success',
            failureRedirect: '../failure',
        }));
    }

    router.get('/failure', (req: Request, res: Response): void => {
        res.redirect('./external_form');
    });

    router.get('/success', (req: Request, res: Response): void => {
        if (req.session.return_url) {
            res.redirect(req.session.return_url);
            delete req.session.return_url;
        } else {
            res.redirect('../../../');
        }
    });

    router.get('/logout/done', (req, res): void => {
        req.logout();

        res.redirect('../success');
    });

    router.get('/logout', (req: Request, res: Response): void => {
        if (!req.isAuthenticated()) {
            return res.redirect('/');
        }

        const url = client.endSessionUrl({
            post_logout_redirect_uri: format({
                host: req.header('host'),
                protocol: req.header('x-forwarded-proto') || 'http',
                pathname: logoutUrl,
            }),
            id_token_hint: req.session.passport.user.id_token,
        });

        req.session.destroy(() => { });

        res.clearCookie('connect.sid', { path: '/curriculum-builder' });
        res.clearCookie('connect.sid', { path: '/gradebook' });

        res.redirect(url);
    });

    app.use((req: Request, res: Response, next: NextFunction): void => {
        if (!req.isAuthenticated()) {
            const err: any = new Error(config.unauthorised.url);
            err.code = 401;
            throw err;
        }

        if (!Object.keys(req.user).length) {
            const err: any = new Error('No ACCESS');
            err.code = 400;
            throw err;
        }

        next();
    });

    app.use(async (req: Request, res: Response, next: NextFunction) => {
        if (req.cookies.schoolId) {
            req.session.schoolId = req.cookies.schoolId;
        }

        let school: any = await models.school.findOne({
            where: {
                id: req.session.schoolId,
                disabled: 0,
            },
            include: [
                models.city,
                models.branch,
            ],
        });

        const { access } = req.user;

        if (!school
            || (
                !access.isSuperAdmin
                && !access.branchesId.includes(school.branch_id)
                && !access.schoolsId.includes(school.id)
            )
        ) {
            school = null;
            req.session.schoolId = 0;
            req.cookies.schoolId = 0;
        }
        req.user.school = school ? {
            id: school.id,
            name: school.name,
            branchId: school.branch_id,
            branch: school.branch_id ? {
                id: school.branch.id,
                name: school.branch.name,
                domain: school.branch.domain,
            } : undefined,
            city: {
                id: school.city.id,
                name: school.city.name,
            },
            active_report_year: school.active_report_year ?
                school.active_report_year : undefined,
        } : undefined;

        next();
    });

    app.get('/users/me', (req: Request, res: Response): void => {
        res.json(req.user);
    });

    app.get('/users/profile', async (req: Request, res: Response): Promise<void> => {
        const user: IProfile = await models.user.findOne({
            attributes: ['id', 'name', 'surname', 'middle_name', 'birthday', 'msisdn', 'email'],
            where: {
                id: req.user.id,
            },
            include: [{
                attributes: ['university', 'speciality', 'category', 'graduation_year', 'training_year', 'education'],
                required: false,
                model: models.teacher,
            }],
        });

        if (user) {
            // @ts-ignore
            user.dataValues.changePassUrl = client.issuer.issuer + client.issuer.change_pass_url;
        }

        res.json(user);
    });

    app.use((req: Request, res: Response, next: NextFunction): void => {
        if (req.user.disabled || !req.user.interfaces.ADMIN) {
            const err: any = new Error('Access denied');
            err.code = 403;
            throw err;
        }

        next();
    });
};
