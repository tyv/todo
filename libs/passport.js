var passport = require('passport'),
    LocalStrategy  = require('passport-local').Strategy,

    mongoose = require('mongoose'),
    User = require(path.resolve(global.appRoot, 'libs/UserSchema'));

module.exports = function() {
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
    console.log('serializeUser', user);
    done(null, user.id);

  });


  passport.deserializeUser(function(id, done) {

    User.findById(id, function(err, user) {

      if (err) return done(err);
      done(null, user);

    });

  });

};