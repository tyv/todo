var express = require('express');
    path = require('path'),
    appRoot = global.appRoot = path.resolve(__dirname),

    favicon = require('serve-favicon'),

    winston = require('winston'),
    logger = require(path.resolve(appRoot, 'libs/logger')),

    config = require(path.resolve(appRoot, 'libs/config')),

    mongoose = require('mongoose'),

    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),

    passport = require('passport'),

    index = require(path.resolve(appRoot, 'routes/index')),
    json_api = require(path.resolve(appRoot, 'routes/json_api')),
    passport_api = require(path.resolve(appRoot, 'routes/passport')),

    session = require('express-session'),

    LocalStrategy  = require('passport-local').Strategy,
    User = require(path.resolve(global.appRoot, 'libs/UserSchema')),

    app = express();

app.use(require('winston-request-logger').create(logger));

//DB connection
mongoose.connect(config.get('mongoose:uri'), function(err) {

    if (err) {
        logger.error('mongodb connection error', err);
    } else {
        logger.info('successfull mongodb connection');
    }

});


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
        secret: 'SECRET',
        resave: false,
        saveUninitialized: true
    }));

//Passport

app.use(passport.initialize());
app.use(passport.session());


  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, function(username, password, done) {

    User.findOne({ username : username }, function(err, user) {

        if (err) done(err);

        if (user) {

            password === user.password ?
              done(null, user) :
              done(null, false, { message: 'Incorrect password.' });

        } else {

            done(null, false, { message: 'Incorrect username.' });

        }
    });
  }));


  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });


  passport.deserializeUser(function(id, done) {

    User.findById(id, function(err, user) {

      if (err) return done(err);
      done(null, user);

    });

  });



app.use(express.static(path.join(__dirname, 'public')));


app.use('/', index);
app.use('/todo', json_api);
app.use('/passport', passport_api);

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
