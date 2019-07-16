import models from '../models';

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Expressa' });
});

router.post('/register', async (req, res, next) => {
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
});

module.exports = router;
