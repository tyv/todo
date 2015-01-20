var express = require('express');
    path = require('path'),

    favicon = require('serve-favicon'),

    winston = require('winston'),
    logger = new (winston.Logger)({ transports: [ new (winston.transports.Console)({colorize:true}) ] }),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),

    mongoose = require('mongoose'),

    index = require('./routes/index'),
    json_api = require('./routes/json_api'),

    app = express();

app.use(require('winston-request-logger').create(logger));

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//DB connection
mongoose.connect('mongodb://localhost/todo', function(err) {

    if (err) {
        logger.log('error', 'mongodb connection error', err);
    } else {
        logger.log('info', 'successfull mongodb connection');
    }

});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));


app.use('/', index);
app.use('/todo', json_api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
