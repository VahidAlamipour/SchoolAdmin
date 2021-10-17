import * as faker from "faker";
import { sdk } from "./config";

describe("SDK", () => {
    beforeAll(async () => {
        await sdk.fakeLogin();
    });

    describe("academic years", () => {
        test("crud", async () => {
            const cities = await sdk.getCities({
                limit: 1,
                query: "Test",
            });

            expect(cities.count).toBeGreaterThan(0);

            const schoolId = await sdk.newSchool({
                name: faker.random.uuid(),
                fullName: "TEST.JS",
                cityId: cities.list[0].id,
            });

            expect(schoolId).toBeDefined();

            const years = await sdk.getYears({ schoolId });

            expect(years.length).toBeGreaterThan(0);

            const days = await sdk.getDays({countryId: cities.list[0].countryId});

            expect(days.length).toBeGreaterThan(0);

            const id = await sdk.newAcademicYear({ schoolId }, {
                yearId: years[0].id,
                daysIds: days.map((day) => day.id),
                shifts: [{
                    times: [{
                        start: "04:19:00",
                        end: "04:20:00",
                    }],
                }],
                periods: [{
                    startDate: (new Date()).toJSON(),
                    endDate: (new Date()).toJSON(),
                }],
            });

            const academicYears = await sdk.getAcademicYears({ schoolId });

            expect(academicYears.count).toBe(1);

            const year = await sdk.getAcademicYear(id);

            expect(year.yearId).toBeDefined();
            expect(year.name).toBeDefined();
            expect(year.intervals).toBeDefined();
            expect(year.terms).toHaveLength(1);
            expect(year.shifts).toHaveLength(1);
            expect(year.days).toHaveLength(days.length);
        });
    });
});
