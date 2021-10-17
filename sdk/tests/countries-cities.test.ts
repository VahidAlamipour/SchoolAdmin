import { sdk } from "./config";

describe("SDK", () => {
    beforeAll(() => sdk.fakeLogin());

    describe("Cities", () => {
        test("pagination", async (done) => {
            const params = {
                limit: 1,
                page: 0,
            };

            const res = await sdk.getCities(params);

            expect(res.page).toBe(params.page);
            expect(res.pages).toBe(res.count);
            expect(res.list.length).toBeLessThanOrEqual(params.limit);

            done();
        });

        test("pagination by country", async (done) => {
            const countries = await sdk.getCountries({query: "test"});

            expect(countries.count).toBeGreaterThan(0);

            const countryId = countries.list[0].id;

            const params = {
                limit: 1,
                page: 0,
                countryId,
            };

            const res = await sdk.getCities(params);

            expect(res.page).toBe(params.page);
            expect(res.pages).toBe(res.count);
            expect(res.list.length).toBeLessThanOrEqual(params.limit);

            done();
        });
    });
});
