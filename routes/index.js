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
  const response = await teacher.registerStudents(studentsEmail);
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

module.exports = router;
