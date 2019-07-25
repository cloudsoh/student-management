import models from '../models';
import asyncHandler from '../core/async-handler';
import { check, validationResult } from 'express-validator';

const Op = models.Sequelize.Op;
const sequelize = models.sequelize;
var express = require('express');
var router = express.Router();

router.post('/register', [
  check('teacher').isEmail(),
  check('students').isArray(),
  check('students.*').isEmail(),
], asyncHandler(async (req, res, next) => {
  const { teacher: teacherEmail, students: studentsEmail } = req.body;

  const [teacher] = await models.Teacher.findOrCreate({
    where: {
      email: teacherEmail
    }
  })

  const result = await teacher.registerStudents(studentsEmail);
  res.sendStatus(204);
}));

router.get('/commonstudents', [
  check('teacher').isEmail()
], asyncHandler(async (req, res, next) => {
  const { teacher: teacherEmail } = req.query;
  // teacher may be a string or array, convert it to array.
  const teacherEmails = Array.isArray(teacherEmail) ? teacherEmail : [teacherEmail];

  // Query that find the students that has been shared across all the teacher provided
  const data = await models.StudentTeacher.findAll({
    attributes: [
      // Count of student-teacher relationship that is taught by these teachers
      [sequelize.fn('COUNT', sequelize.col('*')), 'count']
    ],
    group: ['Student.email', 'Student.id'],

    // Only get the students which the count = given teacher
    // Since I only query these teachers' student, 
    // If the queried student's "teacher count" is equal to given teacher's length
    // Then it is taught by all the teachers given.
    having: sequelize.where(sequelize.col('count'), '=', teacherEmails.length),
    include: [
      {
        model: models.Teacher,
        where: {
          email: {
            [Op.in]: teacherEmails
          }
        },
        attributes: []
      },
      {
        model: models.Student,
        attributes: ['email'],
      },
    ]
  })
  const students = data.map(student => student.Student.email)
  res.status(200).send({ students })
}));

router.post('/suspend', [
  check('student').isEmail()
], asyncHandler(async (req, res, next) => {
  const { student: email } = req.body;

  const result = await models.Student.update({ suspendedAt: Date.now() }, { where: { email }})
  res.sendStatus(204)
}))

router.post('/retrievefornotifications', [
  check('teacher').isEmail(),
  check('notification').isString()
], asyncHandler(async (req, res, next) => {
  const { teacher: teacherEmail, notification } = req.body

  const teacher = await models.Teacher.findOne({ where: { email: teacherEmail }})
  // Get teacher's students
  let students = await teacher.getStudents({ 
    attributes: ['email'],
    where: {
      suspendedAt: {
        [Op.eq]: null
      }
    }
  })

  const myRegexp = /@(\w*@\w*\.\S+)/g;
  let match = myRegexp.exec(notification);
  const taggedStudentsEmail = []

  // Get the email after '@'
  while (match) {
    taggedStudentsEmail.push(match[1])
    match = myRegexp.exec(notification);
  }

  // Find all the tagged email from the students table
  const taggedStudents = await models.Student.findAll({
    attributes: ['email'],
    where: {
      email: {
        [Op.in]: taggedStudentsEmail
      },
      suspendedAt: {
        [Op.eq]: null
      }
    }
  })

  // Combine teacher's self students and tagged students
  students = students.concat(taggedStudents).map(({ email }) => email)

  // Only respond the non-duplicating students
  res.status(200).send({ recipients: [ ...new Set(students)] })
}))

module.exports = router;
