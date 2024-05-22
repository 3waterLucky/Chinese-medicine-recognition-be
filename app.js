var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const usersRouter = require('./routes/users');
const recogRouter = require('./routes/recog')
const gameRouter = require('./routes/game')
const medicineRouter = require('./routes/medicine')
const jwt = require('jsonwebtoken')

var app = express();

// 无需验证token的请求
const unless = ['/users/login', '/users/register', '/recog','/medicine/list', '/users/checkAccount']

// 使用jwt.verify验证token
app.use((req, res, next) => {
  if (unless.includes(req.url) || req.url.startsWith('/images') || req.url.startsWith('/medicine/detail')){
    next()
  } else {
    jwt.verify(req.headers.authorization.split(' ')[1], 'zjz-ujs', (err, user) => {
      if (err) {
        console.error('error', err)
        res.status(401).send({
          code: 401,
          message: 'invalid token'
        })
      }
      req.user = user
      next()
    })
  }
})

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/recog', recogRouter)
app.use('/game', gameRouter)
app.use('/medicine', medicineRouter)

// 捕获token错误
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {   
    res.status(401).send('invalid token')
  }
})

app.listen(8080, () => {
  console.log('listening on port 8080')
})

module.exports = app;
