import models from '../models';
import asyncHandler from '../core/async-handler';

const Op = models.Sequelize.Op;
const sequelize = models.sequelize;
var express = require('express');
var router = express.Router();


router.post('/register', asyncHandler(async (req, res, next) => {
  const { teacher: teacherEmail, students: studentsEmail } = req.body;
  const teacher = await models.Teacher.findOne({
    where: {
      email: teacherEmail
    }
  })
  if (!teacher) {
    res.status(404).send('Teacher not found');
    return;
  }
  const result = await teacher.registerStudents(studentsEmail);
  res.sendStatus(204);
}));

router.get('/commonstudents', asyncHandler(async (req, res, next) => {
  const { teacher: teacherEmail } = req.query;
  const teacherEmails = Array.isArray(teacherEmail) ? teacherEmail : [teacherEmail];
  const data = await models.StudentTeacher.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('*')), 'count']
    ],
    group: ['Student.email'],
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

router.post('/suspend', asyncHandler(async (req, res, next) => {
  const { student: email } = req.body;

  const result = await models.Student.update({ suspendedAt: Date.now() }, { where: { email }})
  res.sendStatus(204)
}))

router.post('/retrievefornotifications', asyncHandler(async (req, res, next) => {
  const { teacher: teacherEmail, notification } = req.body

  const teacher = await models.Teacher.findOne({ where: { email: teacherEmail }})
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

  while (match) {
    taggedStudentsEmail.push(match[1])
    match = myRegexp.exec(notification);
  }

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

  students = students.concat(taggedStudents).map(({ email }) => email)

  res.status(200).send({ recipients: [ ...new Set(students)] })
}))

module.exports = router;
