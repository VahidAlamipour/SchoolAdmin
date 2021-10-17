import faker from "faker";
import { sdk, randomUser } from "./config";

describe("SDK", () => {
    beforeAll(() => sdk.fakeLogin());

    describe("Timetable", () => {
        test("get lessons", async () => {
            const me = await sdk.getMe();

            const academicYear = await sdk.getAcademicYears({ schoolId: me.school.id }).then(data => data.list[0]);

            const classId: number = await sdk.getClasses({ limit: 1 }).then(data => data.list[0].id).then(Number);

            const lessons = await sdk.getLessons({
                classId,
                academicYearId: academicYear.id,
            });

            expect(lessons).toBeDefined();
        });

        test("create", async () => {
            const me = await sdk.getMe();

            const classId: number = await sdk.getClasses({ limit: 1 }).then(data => data.list[0].id).then(Number);

            const academicYear = await sdk.getAcademicYears({ schoolId: me.school.id }).then(data => data.list[0]);

            const subjectId: number = await sdk.getSubjects({ limit: 1 }).then(data => data.list[0].id).then(Number);

            const teacherId = await sdk.newTeacher({
                ...randomUser(),
                headOfSubjectsIds: [ subjectId ]
            });

            const roomId = await sdk.newRoom({
                capacity: faker.random.number({ min: 10, max: 50 }),
                description: faker.random.words(3),
                name: faker.random.uuid(),
                subjectsIds: [ subjectId ],
            });

            const lessonId = await sdk.newLesson({
                academicYearId: academicYear.id,
                date: new Date(new Date().setDate(new Date().getDate() + 1)),
                classId,
                timeId: Number(academicYear.shifts && academicYear.shifts[0].times && academicYear.shifts[0].times[0].id),
                subjectId,
                teacherId,
                roomId,
            });

            expect(lessonId).toBeDefined();
        })
    });
});
