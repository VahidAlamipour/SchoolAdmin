import * as faker from "faker";

import { AdminSDK as SDK } from "../index";

const baseURL = process.env.BASEURL;

if (!baseURL) {
    throw new Error("BASEURL env not defined");
}

export const sdkConfig = {
    baseURL,
    headers: {
        Cookie: `schoolId=0;`,
    },
};

class TestSDK extends SDK {

    public async fakeLogin(email?: string) {
        await super.fakeLogin(email);

        const school = await this.getSchools({ limit: 1, query: "Jest" });
        this.selectSchool(Number(school.list[0].id));
    }
}
export const sdk = new TestSDK(sdkConfig);

export function randomUser() {
    const user = {
        name: `${faker.name.prefix()}${faker.name.firstName()}`,
        lastName: faker.name.lastName(),
        msisdn: faker.phone.phoneNumber(`375#########`),
    };

    return {
        ...user,
        address: `${faker.address.city()}, ${faker.address.streetAddress()}`,
        birthday: faker.date.between("01/01/1970", "01/01/2000"),
        middleName: "",
        email: faker.internet.email(user.name, faker.random.uuid(), `${faker.random.locale()}_jest.test`),
    };
}
