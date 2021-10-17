import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../config';
const { MessageQueue } = require('../services/queue');
import db from '../db';

const queue = new MessageQueue(config.get('rabbitmq:connectstring'));

const METHODS = {
    POST: 'post',
    PUT: 'put',
    DELETE: 'delete',
};

export class BeedError extends Error {
    public readonly code: number;

    public constructor(message: string, code: number) {
        super(message);
        this.code = code;
    }
}

export class BeedSDK {
    private options: AxiosRequestConfig;

    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    constructor(options: AxiosRequestConfig = {}) {
        this.options = options;
        queue.on('beedos.registration', async (data): Promise<void> => {
            await db.user.update({
                activated: 1,
            }, { where: {
                external_id: data.subid
            }});
        });
    }

    public async request(options: AxiosRequestConfig) {
        return axios({
            ...this.options,
            ...options,
            validateStatus: () => true,
        }).then((res) => {
            if (res.status < 400) {
                return res.data;
            } else {
                throw new BeedError(`BeedService:  ${this.parseError(res)}`, res.status);
            }
        });
    }

    private parseError(res: AxiosResponse): any {
        try {
            return res.data.Register || res.data[0].description;
        } catch {
            return res.statusText;
        }
    }

    public async createNewUser(data: {
        username: string;
        Email: string;
        FirstName: string;
        lastname: string;
        phonenumber: string;
        ReturnUrl: string;
    }): Promise<{
        id: number;
        userName: string;
        email: string;
        firstName: string;
        lastName?: string;
        phoneNumber?: string;
        activationCode: string;
    }> {
        return this.request({
            url: '/user/register2',
            method: METHODS.POST,
            data,
        });
    }
}

export default new BeedSDK({
    baseURL: config.get('auth:issuer:issuer')
});
