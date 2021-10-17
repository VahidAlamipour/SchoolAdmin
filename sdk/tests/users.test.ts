import { sdk } from "./config";

describe("SDK", () => {
    beforeAll(() => sdk.fakeLogin());

    describe("Users", () => {
        test("activation/deactiation", async () => {
            const userId: number = await sdk.getTeachers({
                limit: 1
            }).then(data => data.list[0].id).then(Number);

            await sdk.activateUser(userId);

            {
                const user = await sdk.getTeachers({
                    limit: 1
                }).then(data => data.list[0]);

                expect(user.active).toBeTruthy();
            }

            await sdk.deactivateUser(userId);

            {
                const user = await sdk.getTeachers({
                    limit: 1
                }).then(data => data.list[0]);

                expect(user.active).toBeFalsy();
            }
        });
    });
});
