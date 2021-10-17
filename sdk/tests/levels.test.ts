import * as faker from "faker";
import { sdk } from "./config";

describe("SDK", () => {
    beforeAll(() => sdk.fakeLogin());

    describe("levels", () => {
        test("values", async () => {
            const res = await sdk.getLevelsValues();

            expect(res.length).toBeGreaterThan(0);
        });

        test("pagination", async () => {
            const segment = await sdk.getSegments({ limit: 1 }).then(data => data.list[0]);

            const params = {
                limit: 1,
                page: 2,
                segmentId: segment.id,
            };

            const res = await sdk.getLevels(params);

            expect(res.page).toBe(params.page);
            expect(res.pages).toBe(res.count);
            expect(res.list.length).toBeLessThanOrEqual(params.limit);
        });

        test.skip("crud // to deprecate", async () => {
            const segmentId = await sdk.newSegment({
                name: faker.random.uuid()
            });

            const values = await sdk.getLevelsValues({ segmentId });

            expect(values.length).toBeGreaterThan(0);

            const id = await sdk.newLevel({
                name: values[0].name,
                segmentId,
            });

            expect(id).toBeDefined();

            const level = await sdk.getLevel(id);

            const newValues = await sdk.getLevelsValues({ segmentId });

            expect(newValues.length).toBeGreaterThan(0);

            await sdk.updateLevel(id, {
                name: newValues[0].name,
            });

            const updatedLevel = await sdk.getLevel(id);

            expect(updatedLevel.name).not.toBe(level.name);

            await sdk.deleteLevel(id);

            await expect(sdk.getLevel(id)).rejects.toThrow();
        });

        test("crud", async () => {
            const segmentId = await sdk.newSegment({
                name: faker.random.uuid()
            });

            const values = await sdk.getLevelsValues({ segmentId });

            expect(values.length).toBeGreaterThan(0);

            const id = await sdk.newLevel({
                value: values[0].id,
                segmentId,
            });

            expect(id).toBeDefined();

            const level = await sdk.getLevel(id);

            const newValues = await sdk.getLevelsValues({ segmentId });

            expect(newValues.length).toBeGreaterThan(2);

            await sdk.updateLevel(id, {
                value: values[2].id,
            });

            const updatedLevel = await sdk.getLevel(id);

            expect(updatedLevel.name).not.toBe(level.name);

            await sdk.deleteLevel(id);

            await expect(sdk.getLevel(id)).rejects.toThrow();
        });
    });
});
