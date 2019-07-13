var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Expressa' });
});

router.post('/register', (req, res, next) => {
  res.send(req.body);
});

module.exports = router;
