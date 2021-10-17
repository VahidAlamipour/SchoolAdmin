import { sdk } from "./config";

describe("SDK", () => {
    beforeAll(async () => {
        await sdk.fakeLogin();
    });

    describe("schools", () => {
        test("school structure", async () => {
            const res = await sdk.getSchoolStructure();

            expect(res).toBeDefined();
        });

        test("levels structure", async () => {
            const res = await sdk.getSchoolLevelsStructure();

            expect(res).toBeDefined();
        });
    });
});
