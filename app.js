var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const expressJwt = require('express-jwt')

const usersRouter = require('./routes/users');
const recogRouter = require('./routes/recog')
const gameRouter = require('./routes/game')
const medicineRouter = require('./routes/medicine')


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/recog', recogRouter)
app.use('/game', gameRouter)
app.use('/medicine', medicineRouter)

app.use(expressJwt({
  secret: 'zjz',
  algorithms: ['HS256']
}).unless({
  path: ['/users/login', '/users/register', '/recog','/medicine/list', '/medicine/detail']
})
)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(8080, () => {
  console.log('listening on port 8080')
})

module.exports = app;
