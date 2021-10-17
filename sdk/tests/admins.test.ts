import * as faker from "faker";
import { randomUser, sdk } from "./config";

describe("SDK", () => {
    beforeAll(() => sdk.fakeLogin());

    describe("Stuff", () => {
        test("pagination", async () => {
            const params = {
                limit: 1,
                page: 0,
            };

            {
                const res = await sdk.getAdmins(params);

                expect(res.page).toBe(params.page);
                expect(res.pages).toBe(res.count);
                expect(res.list.length).toBeLessThanOrEqual(params.limit);
            }
        });

        test("crud", async () => {
            const schools = await sdk.getSchools({ limit: 1, query: "Jest" });

            expect(schools.count).toBeGreaterThan(0);

            const id = await sdk.newAdmin({
                ...randomUser(),
                schoolsId: schools.list.map(school => Number(school.id)),
            });

            expect(id).toBeDefined();

            const user = await sdk.getAdmin(id);

            expect(user.name).toBeDefined();
            expect(user.email).toBeDefined();
            expect(user.schools).toHaveLength(schools.list.length);

            await sdk.updateAdmin(id, {
                ...randomUser(),
            });

            await sdk.deleteAdmin(id);

            await expect(sdk.getAdmin(id)).rejects.toThrow();
        });


        test("Account teacher", async () => {
            const school = await sdk.getSchools({ limit: 1, query: "Jest" }).then(data => data.list[0]);

            const teacherId = await sdk.newTeacher({
                ...randomUser(),
                education: faker.random.word(),
                university: faker.random.word(),
                speciality: faker.random.word(),
                category: faker.random.word(),
                graduationYear: faker.date.between("01/01/2000", "01/01/2010"),
                trainingYear: faker.date.between("01/01/2000", "01/01/2010"),
                isDirector: true,
            });

            await sdk.updateUserRoles(teacherId, {
                studentsIds: [],
                adminSchoolsIds: [],
                teacherRoles: [{
                    schoolId: school.id,
                    isDirector: true
                }],
                accountRole: {
                    isCurriculumDirector: true,
                    isDirector: false,
                }
            })

            {
                const roles = await sdk.getUserRoles(teacherId);

                expect(roles.accountRoles).toEqual({
                    isCurriculumDirector: true,
                    isDirector: false,
                });
            }

            await sdk.updateUserRoles(teacherId, {
                studentsIds: [],
                adminSchoolsIds: [],
                teacherRoles: [{
                    schoolId: school.id,
                    isDirector: true
                }],
                accountRole: {
                    isCurriculumDirector: false,
                    isDirector: true,
                }
            })

            {
                const roles = await sdk.getUserRoles(teacherId);

                expect(roles.accountRoles).toEqual({
                    isCurriculumDirector: false,
                    isDirector: true,
                });
            }

            await sdk.deleteTeacher(teacherId);
        });
    });
});
