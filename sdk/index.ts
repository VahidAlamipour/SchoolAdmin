import { AxiosResponse } from "axios";

import { SDK } from "./sdk";

export class AdminSDK extends SDK {
    public processResponse(res: AxiosResponse) {
        if (res.headers["set-cookie"]) {
            if (!this.options.headers) {
                this.options.headers = {
                    Cookie: `schoolId=0;`,
                };
            }
            this.options.headers.Cookie += res.headers["set-cookie"][0];
        }

        if (res.status < 400) {
            return res.data;
        } else {
            const text = `HTTP_ERROR [${res.status}]: ${res.data || res.statusText} at ${res.request.method} ${res.request.path}`;
            console.warn(text);
            throw new Error(text);
        }
    }

    public async fakeLogin(email: string = "ac@bamboogroup.eu") {
        await this.request({
            url: `/v1/auth/fake/${email}`,
            maxRedirects: 0
        });
    }

    public async selectSchool(id: number) {
        this.options.headers.Cookie = this.options.headers.Cookie.replace(/schoolId=([0-9]+)/g, `schoolId=${id}`);
    }
}
