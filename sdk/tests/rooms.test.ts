import * as faker from "faker";
import { sdk } from "./config";

describe("SDK", () => {
    beforeAll(() => sdk.fakeLogin());

    describe("rooms", () => {
        test("pagination", async (done) => {
            const params = {
                limit: 1,
                page: 2,
            };

            const res = await sdk.getRooms(params);

            expect(res.page).toBe(params.page);
            expect(res.pages).toBe(res.count);
            expect(res.list.length).toBeLessThanOrEqual(params.limit);

            done();
        });

        test("crud", async (done) => {
            const id = await sdk.newRoom({
                capacity: faker.random.number({ min: 10, max: 50 }),
                description: faker.random.words(3),
                name: faker.random.uuid(),
                subjectsIds: [],
            });

            expect(id).toBeDefined();

            const room = await sdk.getRoom(id);

            expect(room.name).toBeDefined();

            await sdk.updateRoom(id, {
                capacity: faker.random.number({ min: 10, max: 50 }),
                description: faker.random.words(3),
                name: faker.random.uuid(),
                subjectsIds: [],
            });

            const updatedRoom = await sdk.getRoom(id);

            expect(room.name).not.toBe(updatedRoom.name);

            await sdk.deleteRoom(id);

            await expect(sdk.getRoom(id)).rejects.toThrow();

            done();
        });
    });
});
