import * as faker from "faker";
import { sdk } from "./config";

describe("SDK", () => {
    beforeAll(() => sdk.fakeLogin());

    describe("Groups", () => {
        test("pagination", async (done) => {
            const klass = await sdk.getClasses({ limit: 1 }).then(data => data.list[0]);

            const params = {
                limit: 1,
                page: 0,
                classId: Number(klass.id),
            };

            const res = await sdk.getGroups(params);

            expect(res.page).toBe(params.page);
            expect(res.pages).toBe(res.count);
            expect(res.list.length).toBeLessThanOrEqual(params.limit);

            done();
        });

        test.skip("crud", async (done) => {
            const klass = await sdk.getClasses({ limit: 1 }).then(data => data.list[0]);

            function randomGroup(studentsIds: number[] = []) {
                return {
                    name: faker.random.uuid(),
                    studentsIds,
                };
            }

            const subjectId = await sdk.newSubject({
                name: faker.random.uuid(),
            });

            const id = await sdk.newGroup({
                subjectId,
                classId: klass.id,
                subgroups: [{
                    name: faker.random.uuid(),
                }],
            });

            expect(id).toBeDefined();

            const item = await sdk.getGroup(id);

            if (item.subject) {
                expect(item.subject.id).toBe(subjectId);
            }

            if (item.subgroups) {
                expect(item.subgroups.length).toBe(1);

                const subgroup = item.subgroups[0];

                if (subgroup.id) {
                    await sdk.getSubGroup(subgroup.id);
                } else {
                    throw new Error("NO ID");
                }

                if (subgroup.students) {
                    expect(subgroup.students.length).toBeGreaterThanOrEqual(0);
                }
            }

            const students = await sdk.getStudents({ limit: 1 });
            
            await sdk.updateGroup(id, {
                subjectId,
                subgroups: [
                    randomGroup(students.list.map(student => Number(student.id))),
                    randomGroup(students.list.map(student => Number(student.id))),
                ],
            });

            const updated = await sdk.getGroup(id);

            expect(updated).toBeDefined();

            await expect(sdk.updateGroup(id, {
                subjectId,
                subgroups: [
                    randomGroup(students.list.map(student => Number(student.id))),
                    randomGroup(students.list.map(student => Number(student.id))),
                    randomGroup(students.list.map(student => Number(student.id))),
                    randomGroup(students.list.map(student => Number(student.id))),
                    randomGroup(students.list.map(student => Number(student.id))),
                    randomGroup(students.list.map(student => Number(student.id))),
                ],
            })).rejects.toThrow();

            await sdk.deleteGroup(id);

            await expect(sdk.getGroup(id)).rejects.toThrow();

            done();
        });
    });
});
