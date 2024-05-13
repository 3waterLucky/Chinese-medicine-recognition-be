var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const usersRouter = require('./routes/users');
const recogRouter = require('./routes/recog')
const gameRouter = require('./routes/game')
const medicineRouter = require('./routes/medicine')

const { expressjwt: jwt } = require('express-jwt')

var app = express();

app.use(jwt({
  secret: 'zjz-ujs',
  algorithms: ['HS256'],
  credentialsRequired: false,
  getToken: function fromHeaderOrQuerystring (req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  }
}).unless({
  path: ['/users/login', '/users/register', '/recog','/medicine/list', '/medicine/detail']
}))

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
