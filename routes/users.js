import { Teacher } from '../models';

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', async function(req, res, next) {
  // console.log(models.Teacher)
  const result = await Teacher.create({
    email: 'asd@asd.com' + Math.random(),
  })
  console.log(1)
  console.log(result)
  console.log(result.email)
  console.log(2)
  res.send('respond with a resource');
});

module.exports = router;
