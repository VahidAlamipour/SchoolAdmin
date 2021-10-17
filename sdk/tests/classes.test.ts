import * as faker from "faker";
import { randomUser, sdk } from "./config";

describe("SDK", () => {
    beforeAll(() => sdk.fakeLogin());

    describe("classes", () => {
        test("pagination", async () => {
            const params = {
                limit: 1,
                page: 0,
            };

            const res = await sdk.getClasses(params);

            expect(res.page).toBe(params.page);
            expect(res.pages).toBe(res.count);
            expect(res.list.length).toBeLessThanOrEqual(params.limit);
        });

        test("crud", async () => {
            const levelId = await sdk.getLevels({ limit: 1 }).then((data) => data.list[0].id);

            const id = await sdk.newClass({
                levelId,
                name: faker.random.uuid(),
                showName: true,
            });

            expect(id).toBeDefined();

            const klass = await sdk.getClass(id);

            expect(klass.name).toBeDefined();
            expect(klass.showName).toBe(true);

            const teacherId = await sdk.newTeacher({
                ...randomUser(),
                isDirector: true,
            });

            await sdk.updateClass(id, {
                levelId,
                name: faker.random.uuid(),
                showName: false,
                teacherId,
            });

            const updatedClass = await sdk.getClass(id);

            expect(updatedClass.name).not.toBe(klass.name);
            expect(updatedClass.showName).toBe(false);
            expect(updatedClass.teacher).toBeDefined();

            const teacher = await sdk.getTeacher(teacherId);

            expect(teacher.types).toContain("HOMEROOM_EDUCATOR");

            await sdk.deleteClass(id);

            await expect(sdk.getClass(id)).rejects.toThrow();

            const updTeacher = await sdk.getTeacher(teacherId);

            expect(updTeacher.types).not.toContain("HOMEROOM_EDUCATOR");
        });
    });
});
