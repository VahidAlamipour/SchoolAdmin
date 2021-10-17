import * as faker from "faker";
import { randomUser, sdk } from "./config";

describe("SDK", () => {
    beforeAll(() => sdk.fakeLogin());

    describe("parents", () => {
        test("crud", async () => {
            const segmentId = await sdk.newSegment({
                name: faker.random.uuid(),
            });

            const levelValue = await sdk.getLevelsValues({
                segmentId
            });

            const levelId = await sdk.newLevel({
                segmentId,
                value: levelValue[0].id
            });

            const educationalClassId = await sdk.newClass({
                levelId,
                name: faker.random.uuid(),
                showName: false,
            });

            const studentId = await sdk.newStudent({
                ...randomUser(),
                educationalClassId,
                gender: "male",
                localAddress: `${faker.address.city()}, ${faker.address.streetAddress()}`,
                phoneNumber: faker.phone.phoneNumber(),
                passportBirthCertificate: faker.random.number().toString(),
                nationality: faker.random.word(),
                religion: faker.random.word(),
                race: faker.random.word(),
                other: faker.lorem.sentence(),
            });

            expect(studentId).toBeDefined();

            const parentId = await sdk.newParent({
                ...randomUser(),
                studentsIds: [studentId],
                familyRole: "guardian",
                nationality: faker.random.word(),
                passportBirthCertificate: faker.random.word(),
                phoneNumber: faker.phone.phoneNumber(),

                designation: faker.random.word(),
                company: faker.random.word(),
                companyAddress: `${faker.address.city()}, ${faker.address.streetAddress()}`,

                parentsStatus: faker.random.word(),
            });

            expect(parentId).toBeDefined();

            const studentWithParent = await sdk.getStudent(studentId);

            expect(studentWithParent.parents).toHaveLength(1);

            {
                const parent = await sdk.getUserRoles(parentId);
                expect(parent.students).toHaveLength(1);
            }

            await sdk.updateUserRoles(parentId, {
                studentsIds: [],
                adminSchoolsIds: [],
                teacherRoles: []
            });

            {
                const parent = await sdk.getUserRoles(parentId);
                expect(parent.students).toHaveLength(0);
            }

            await sdk.updateUserRoles(parentId, {
                studentsIds: [studentId],
                adminSchoolsIds: [],
                teacherRoles: []
            });

            {
                const parent = await sdk.getUserRoles(parentId);
                expect(parent.students).toHaveLength(1);
            }
        });
    });
});
