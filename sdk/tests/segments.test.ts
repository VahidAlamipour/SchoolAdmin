import * as faker from "faker";
import { sdk } from "./config";

describe("SDK", () => {
    beforeAll(() => sdk.fakeLogin());

    describe("segments", () => {
        test("pagination", async (done) => {
            const params = {
                limit: 1,
                page: 0,
            };

            const res = await sdk.getSegments(params);

            expect(res.page).toBe(params.page);
            expect(res.pages).toBe(res.count);
            expect(res.list.length).toBeLessThanOrEqual(params.limit);

            done();
        });

        test("crud", async (done) => {
            const id = await sdk.newSegment({
                name: faker.random.uuid(),
            });

            expect(id).toBeDefined();

            const segment = await sdk.getSegment(id);

            expect(segment.name).toBeDefined();

            await sdk.updateSegment(id, {
                name: faker.random.uuid(),
            });

            const updatedSegment = await sdk.getSegment(id);

            expect(updatedSegment.name).not.toBe(segment.name);

            await sdk.deleteSegment(id);

            await expect(sdk.getSegment(id)).rejects.toThrow();

            done();
        });
    });
});
