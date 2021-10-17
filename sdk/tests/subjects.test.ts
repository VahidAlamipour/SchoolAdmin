import * as faker from "faker";
import { sdk } from "./config";

describe("SDK", () => {
    beforeAll(() => sdk.fakeLogin());

    describe("Subjects", () => {
        test("pagination", async () => {
            const params = {
                limit: 1,
                page: 0,
            };

            const res = await sdk.getSubjects(params);

            expect(res.page).toBe(params.page);
            expect(res.pages).toBe(res.count);
            expect(res.list.length).toBeLessThanOrEqual(params.limit);
        });

        test("crud", async () => {
            const id = await sdk.newSubject({
                name: faker.random.uuid(),
            });

            expect(id).toBeDefined();

            const item = await sdk.getSubject(id);

            expect(item).toBeDefined();

            await expect(sdk.deleteSubject(id)).rejects.toThrow();
        });
    });
});
