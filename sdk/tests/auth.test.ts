import { sdk } from "./config";

describe("SDK", () => {
    describe("auth", () => {
        test("fake", async () => {
            await sdk.fakeLogin();

            const me = await sdk.getMe();

            expect(me).toBeDefined();
        });
    });
});
