declare const require: NodeRequireFunction;

import { ReqUser } from '../crud';

declare namespace Express {
    export interface Request {
        user?: ReqUser;
    }
}