import models from '../models';
import asyncHandler from '../core/async-handler';

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
  await teacher.registerStudents(studentsEmail);
  res.sendStatus(204);
}));

module.exports = router;
