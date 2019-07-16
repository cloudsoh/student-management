import request from 'supertest';
import app from '../app';
import models from '../models';
import { Op } from 'sequelize';
import queryString from 'query-string';

function refreshDatabase() {
    return models.sequelize.sync({ force: true })
}

const agent = request.agent(app);
describe('As a teacher, I want to register one or more students to a specified teacher.', () => {
    beforeEach(refreshDatabase)
    const params = {
        teacher: 'teacherken@gmail.com',
        students: [
            'studentjon@example.com',
            'studenthon@example.com',
        ]
    }
    async function getTeacher(email) {
        const [teacher] = await models.Teacher.findOrCreate({ where: { email }});
        return teacher;
    }
    it('Success Case', async done => {
        const teacher = await getTeacher(params.teacher);
        await agent.post('/api/register')
            .set('Content-Type', 'application/json')
            .send(params)
            .expect(204);
        const students = await models.Student.findAll({
            where: {
                email: {
                    [Op.in]: params.students
                }
            },
            include: [{
                model: models.Teacher,
            }]
        })
        expect(students.length).toBe(params.students.length)
        expect(students).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    email: 'studentjon@example.com',
                    Teachers: 
                        expect.arrayContaining([
                            expect.objectContaining({
                            id: teacher.id
                        })
                    ])
                })
            ])
          )
        done()
    })

    it('Fail Case (Teacher not found)', async done => {
        await agent.post('/api/register')
            .set('Content-Type', 'application/json')
            .send(params)
            .expect(404);
        done()
    })

    it('Fail Case (Student email format)', async done => {
        await getTeacher(params.teacher);
        const newParams = JSON.parse(JSON.stringify(params));
        newParams.students.push('foobar');
        newParams.students.push('barfoo');
        newParams.students.push('boomba');

        await agent.post('/api/register')
            .set('Content-Type', 'application/json')
            .send(newParams)
            .expect(422);
        done()
    })
})
describe('As a teacher, I want to retrieve a list of students common to a given list of teachers(i.e. retrieve students who are registered to ALL of the given teachers).', async () => {
    const teachers = [
        'teacherken@example.com',
        'teacherjoe@example.com'
    ]
    beforeAll(async () => {
        await refreshDatabase
        const [ teacherA ] = await models.Teacher.findOrCreate({ where: { email: teachers[0] }});
        await teacherA.registerStudents([
            'commonstudent1@gmail.com',
            'commonstudent2@gmail.com',
            'student_only_under_teacher_ken@gmail.com'
        ])
        const [ teacherB ] = await models.Teacher.findOrCreate({ where: { email: teachers[1] }});
        await teacherB.registerStudents([
            'commonstudent1@gmail.com',
            'commonstudent2@gmail.com',
            'student_only_under_teacher_joe@gmail.com'
        ])
    })
    
    it('Success Response 1(Get Teacher Ken)', async done => {
        const query = queryString.stringify({ teacher: [ teachers[0] ]});
        await agent.get(`/api/commonstudents?${query}`).expect(200).expect({
            students: [
                'commonstudent1@gmail.com',
                'commonstudent2@gmail.com',
                'student_only_under_teacher_ken@gmail.com'
            ]
        })
        done()
    })
    it('Success Response 1(Get Teacher Ken)', async done => {
        const query = queryString.stringify({ teacher: teachers });
        await agent.get(`/api/commonstudents?${query}`).expect(200).expect({
            students: [
                'commonstudent1@gmail.com',
                'commonstudent2@gmail.com',
            ]
        })
        done()
    })
})