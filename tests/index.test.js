import request from 'supertest';
import app from '../app';
import models from '../models';
import { Op } from 'sequelize';
import queryString from 'query-string';

function refreshDatabase() {
    // Create fresh tables with schema
    return models.sequelize.sync({ force: true })
}

// Helper function to get a teacher model quickly
async function getTeacher(email) {
    const [teacher] = await models.Teacher.findOrCreate({ where: { email }});
    return teacher;
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
        // Should see the registered students in the database
        expect(students.length).toBe(params.students.length)

        // Check student is registered by the given teacher
        expect(students).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    email: params.students[0],
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

    it('Success Case (Teacher is created if no found)', async done => {
        await agent.post('/api/register')
            .set('Content-Type', 'application/json')
            .send(params)
            .expect(204);
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
describe('As a teacher, I want to retrieve a list of students common to a given list of teachers(i.e. retrieve students who are registered to ALL of the given teachers).', () => {
    const teachers = [
        'teacherken@example.com',
        'teacherjoe@example.com'
    ]
    beforeAll(async () => {
        await refreshDatabase()
        const teacherA = await getTeacher(teachers[0]);
        await teacherA.registerStudents([
            'commonstudent1@gmail.com',
            'commonstudent2@gmail.com',
            'student_only_under_teacher_ken@gmail.com'
        ])
        const teacherB = await getTeacher(teachers[1]);
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
    it('Success Response 1(Get Teacher Ken and Joe)', async done => {
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

describe('As a teacher, I want to suspend a specified student.', () => {
    const studentEmail = 'studentmary@gmail.com'
    beforeAll(async () => {
        await refreshDatabase()
        const teacher = await getTeacher('foo@bar.com');
        await teacher.registerStudents([studentEmail])
    });
    it('Success Response 1(Suspend Mary)', async done => {
        await agent.post('/api/suspend')
            .set('Content-Type', 'application/json')
            .send({
                student: studentEmail
            })
            .expect(204);
        const student = await models.Student.findOne({ where: { email: studentEmail }})
        // Should be suspended after the API call
        expect(student.suspendedAt).not.toBeNull()
        done()
    })
});
describe('As a teacher, I want to retrieve a list of students who can receive a given notification', () => {
    const studentsEmail = [
        'studentagnes@example.com',
        'studentmiche@example.com'
    ]
    const teacherEmail = 'teacherken@example.com'
    const teacherStudentsEmail = ['studentbob@example.com']
    beforeAll(async () => {
        await refreshDatabase()
        const teacher = await getTeacher(teacherEmail);
        await teacher.registerStudents(teacherStudentsEmail)
        const teacherB = await getTeacher('foo@bar.com');
        await teacherB.registerStudents(studentsEmail)
    });
    it('Success Response 1(Tagged students)', async done => {
        await agent.post('/api/retrievefornotifications')
            .set('Content-Type', 'application/json')
            .send({
                teacher: teacherEmail,
                notification: 'Hello students! ' + studentsEmail.map(email => `@${email}`).join(' ')
            })
            .expect(200)
            .expect({
                // Contains tagged students
                recipients: teacherStudentsEmail.concat(studentsEmail)
            });
        done()
    })

    it('Success Response 2(Own students only)', async done => {
        await agent.post('/api/retrievefornotifications')
            .set('Content-Type', 'application/json')
            .send({
                teacher: teacherEmail,
                notification: 'Hey everybody!'
            })
            .expect(200)
            .expect({
                recipients: teacherStudentsEmail
            });
        done()
    })
});