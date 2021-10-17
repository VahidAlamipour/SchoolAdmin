import { Application, Router, Request, Response, NextFunction } from 'express';
import { keyBy } from 'lodash';

import { ISegment, ILevel } from '../../sdk/interfaces';
import { ITables } from '../models/db.tables';

import ClassController from '../controllers/classes';
import AcademicYearController from '../controllers/academic-years';
import { ReqUser, IPageQuery } from '../crud';

const classController = new ClassController();
const academicYearController = new AcademicYearController();

export default (app: Application, models: ITables) => {
    const router = Router();

    app.use('/school/structure', router);

    async function getStructure(me: ReqUser, query?: any) {
        const params: IPageQuery = {
            order: 'asc',
            page: 0,
            limit: 100500,
        };
        if(query != null){
            params.isSLC = query;
        }
        const [dbSegments, dbLevels, dbClasses,dbYears] = await Promise.all([
            models.segment.findAll({
                where: {
                    disabled: 0,
                    school_id: me.school.id,
                },
                order: ['name']
            }),
            models.level.findAll(),
            classController.find(params, me),
            models.academic_year.findAll({
                include: [{
                    required: true,
                    model: models.report_year,
                    where: {
                        school_id:me.school.id
                        }
                    }]
            }),
        ]);
        const segmentLevels = await models.segment_level.findAll({
            where: {
                segment_id: dbSegments.map(s => s.id),
                disabled: 0,
            }
        });
        const levelsHash = keyBy(dbLevels, 'id');
        const classes = dbClasses.rows;
        
        const levels = segmentLevels.map((row): ILevel => {
            const levelClasses = classes.filter(c => c.levelId == row.id);

            return {
                id: row.id,
                name: levelsHash[row.level_id].name,
                segmentId: row.segment_id,
                classesIds: levelClasses.map(({ id }) => id),
                classesCount: levelClasses.length,
                studentsCount: levelClasses.map(c => c.studentsCount).reduce((sum, val) => sum + val, 0)
            }
        });
        const segments = dbSegments.map((row: any): ISegment => {
            const levelsIds: number[] = segmentLevels.filter(s => s.segment_id === row.id).map(s => s.id);
            return {
                id: row.id,
                name: row.name,
                levels: levelsIds,
                levelsCount: levelsIds.length,
                studentsCount: levelsIds.map(id => levels.find(l => l.id === id)).map(l => l.studentsCount).reduce((sum, val) => sum + val, 0)
            }
        });
        const academicYears = dbYears.map((academic_year: any) => {
            const row = academic_year.report_years[0];
            return {
                id: row.id,
                yearId: academic_year.id,
                name: `${academic_year.start} - ${academic_year.end}`,
                start: academic_year.start,
                end: academic_year.end,
            };
        });
        return {
            academicYears,
            segments,
            levels,
            classes,
        };
    }

    router.get('/', async (req: Request, res: Response, next: NextFunction) => {
        const structure = await getStructure(req.user);

        res.json(structure);
    });

    router.get('/levels', async (req: Request, res: Response, next: NextFunction) => {
        const { classes, segments, levels } = await getStructure(req.user);

        const segmentsById = keyBy(segments, 'id');
        const levelsById = keyBy(levels, 'id');

        const result = {
            classes: classes.map(row => {
                const level = levelsById[row.levelId];

                return {
                    ...row,
                    level: level ? {
                        id: level.id,
                        name: level.name
                    } : undefined
                };
            }),
            levels: levels.map(level => {
                return {
                    ...level,
                    segment: {
                        ...segmentsById[level.segmentId],
                        levels: undefined
                    }
                };
            }),
        }

        res.json(result);
    });
};
