import * as faker from "faker";
import { randomUser, sdk } from "./config";

describe("SDK", () => {
    beforeAll(() => sdk.fakeLogin());

    describe("Teachers", () => {
        test("Head class teacher - 2 classes for one teacher", async () => {
            const level = await sdk.getLevels({ limit: 1 }).then(data => data.list[0]);

            const teacherId = await sdk.newTeacher({
                ...randomUser(),
                isDirector: true,
            });

            const homeClassId = await sdk.newClass({
                levelId: level.id,
                name: faker.random.uuid(),
                showName: false,
                teacherId
            });

            await expect(sdk.newClass({
                levelId: level.id,
                name: faker.random.uuid(),
                showName: false,
                teacherId
            })).rejects.toThrowError();

            await Promise.all([
                sdk.deleteTeacher(teacherId),
                sdk.deleteClass(homeClassId)
            ]);
        });

        test("Head class teacher - 1 class for two teachers", async () => {
            const level = await sdk.getLevels({ limit: 1 }).then(data => data.list[0]);

            const homeClassId = await sdk.newClass({
                levelId: level.id,
                name: faker.random.uuid(),
                showName: false
            });

            const teacherId = await sdk.newTeacher({
                ...randomUser(),
                isDirector: true,
                homeClassId
            });

            await expect(sdk.newTeacher({
                ...randomUser(),
                isDirector: true,
                homeClassId
            })).rejects.toThrowError();


            await Promise.all([
                sdk.deleteTeacher(teacherId),
                sdk.deleteClass(homeClassId)
            ]);
        });

        test("Head class teacher - change class", async () => {
            const level = await sdk.getLevels({ limit: 1 }).then(data => data.list[0]);

            const homeClassId = await sdk.newClass({
                levelId: level.id,
                name: faker.random.uuid(),
                showName: false
            });

            const teacherId = await sdk.newTeacher({
                ...randomUser(),
                isDirector: true,
                homeClassId
            });

            {
                const teacher = await sdk.getTeacher(teacherId);
                expect(teacher.homeClass).toBeDefined();
            }

            {
                const homeClassId = await sdk.newClass({
                    levelId: level.id,
                    name: faker.random.uuid(),
                    showName: false
                });

                const me = await sdk.getMe();

                await sdk.updateUserRoles(teacherId, {
                    studentsIds: [],
                    teacherRoles: [{
                        schoolId: me.school.id,
                        homeClassId
                    }]
                });

                {
                    const teacher = await sdk.getTeacher(teacherId);
                    expect(teacher.homeClass).toBeDefined();
                }

                await sdk.deleteClass(homeClassId);
            }

            await Promise.all([
                sdk.deleteTeacher(teacherId),
                sdk.deleteClass(homeClassId)
            ]);
        });

        test("Head class teacher - deleted class", async () => {
            const level = await sdk.getLevels({ limit: 1 }).then(data => data.list[0]);

            const homeClassId = await sdk.newClass({
                levelId: level.id,
                name: faker.random.uuid(),
                showName: false
            });

            const teacherId = await sdk.newTeacher({
                ...randomUser(),
                isDirector: true,
                homeClassId
            });

            await sdk.deleteClass(homeClassId);

            {
                const homeClassId = await sdk.newClass({
                    levelId: level.id,
                    name: faker.random.uuid(),
                    showName: false
                });

                const me = await sdk.getMe();

                await sdk.updateUserRoles(teacherId, {
                    studentsIds: [],
                    teacherRoles: [{
                        schoolId: me.school.id,
                        homeClassId
                    }]
                });

                await Promise.all([
                    sdk.deleteTeacher(teacherId),
                    sdk.deleteClass(homeClassId)
                ]);
            }
        });

        test("Delete head class teacher -> assign another teacher to this class", async () => {
            const level = await sdk.getLevels({ limit: 1 }).then(data => data.list[0]);

            const homeClassId = await sdk.newClass({
                levelId: level.id,
                name: faker.random.uuid(),
                showName: false
            });

            const teacherId = await sdk.newTeacher({
                ...randomUser(),
                isDirector: true,
                homeClassId
            });

            await sdk.updateUserRoles(teacherId, {
                studentsIds: [],
                teacherRoles: []
            });

            const teacher2Id = await sdk.newTeacher({
                ...randomUser(),
                isDirector: true,
                homeClassId
            });

            await Promise.all([
                sdk.deleteTeacher(teacherId),
                sdk.deleteTeacher(teacher2Id),
                sdk.deleteClass(homeClassId)
            ]);
        });

        test("Get teachers by subject and level, like in timetable", async () => {
            const segmentId = await sdk.newSegment({
                name: faker.random.uuid()
            });

            const levels = await sdk.getLevelsValues({ segmentId });

            const level1Id = await sdk.newLevel({
                segmentId,
                value: levels[0].id
            });

            const subjectId = await sdk.newSubject({
                name: faker.random.uuid(),
            });

            const levelTeacherId = await sdk.newTeacher({
                ...randomUser(),
                teacherSubjects: [{
                    levelsIds: [level1Id],
                    subjectId
                }]
            });

            {
                const teachers = await sdk.getTeachers({ levelId: level1Id, subjectId });

                expect(teachers.count).toBe(1);
            }

            await Promise.all([
                sdk.deleteTeacher(levelTeacherId),
                sdk.deleteSegment(segmentId)
            ]);
        });
    });
});
