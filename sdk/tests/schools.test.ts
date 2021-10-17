import * as faker from "faker";
import { sdk } from "./config";
import { ICity, IAdministrator } from "../interfaces";

describe("SDK", () => {
    let city: ICity;
    let admin: IAdministrator;

    beforeAll(async () => {
        await sdk.fakeLogin();
        city = await sdk.getCities({ limit: 1, query: "test" }).then((data) => data.list[0]);
        admin = await sdk.getAdmins({ limit: 1, type: "ADMINISTRATOR" }).then((data) => data.list[0]);
    });

    describe("Schools", () => {
        test("pagination", async () => {
            const params = {
                limit: 1,
                page: 0,
                exclude: [],
                cityId: city.id,
            };

            const res = await sdk.getSchools(params);

            expect(res.page).toBe(params.page);
            expect(res.pages).toBe(res.count);
            expect(res.list.length).toBeLessThanOrEqual(params.limit);
        });

        test("crud", async () => {
            const id = await sdk.newSchool({
                name: faker.random.uuid(),
                fullName: "TEST.JS",
                cityId: city.id,
                adminId: [Number(admin.id)],
            });

            expect(id).toBeDefined();

            const school = await sdk.getSchool(id);

            expect(school.name).toBeDefined();

            const actualAdmin = await sdk.getAdmin(Number(admin.id));

            expect(actualAdmin.schools && actualAdmin.schools.map((row) => row.id)).toContain(id);

            await sdk.updateSchool(id, {
                name: faker.random.uuid(),
                fullName: faker.random.uuid(),
                cityId: city.id,
                adminId: [],
            });

            const updated = await sdk.getSchool(id);

            expect(updated.name).not.toBe(school.name);

            await sdk.deleteSchool(id);

            await expect(sdk.getSchool(id)).rejects.toThrow();

            const updatedAdmin = await sdk.getAdmin(Number(admin.id));

            expect(updatedAdmin.schools && updatedAdmin.schools.map((row) => row.id)).not.toContain(id);
        });
    });
});
