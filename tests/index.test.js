import request from 'supertest';
import app from '../app';
import models from '../models';
import { Op } from 'sequelize';

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
            }
        })
        expect(students.length).toBe(params.students.length)
        expect(students).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                email: 'studentjon@example.com',
                registeredBy: teacher.id
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

    it('Fail Case (Student email exist)', async done => {
        await getTeacher(params.teacher);
        await agent.post('/api/register')
            .set('Content-Type', 'application/json')
            .send(params)
            .expect(204);
        await agent.post('/api/register')
            .set('Content-Type', 'application/json')
            .send(params)
            .expect(422);
        done()
    })
})