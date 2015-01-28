var express = require('express'),
    router = express.Router(),
    path = require('path'),
    passport = require('passport'),
    logger = require(path.resolve(global.appRoot, 'libs/logger')),
    Todo = require(path.resolve(global.appRoot, 'libs/UserSchema'));

/*
    POST
    login @ /passoport
*/
router.post('/', function(req, res, next) {

    logger.info('Login attempt');

    passport.authenticate('local',
        function(err, user, info) {

            logger.info('user:', req.body.username);

            if (err) res.end();

            if (user) {

                req.logIn(user, function(err) {

                  if (err) next(err);
                  res
                    .cookie('username', user.username)
                    .end(user.username);

                });

            } else {
                res.end();
            }
        }
    )(req, res, next);
});


/*
    POST
    login @ /passoport/register
*/
router.post('/register', function(req, res, next) {

    var user = new User({ username: req.body.username, password: req.body.password });

    logger.info('Register attempt');
    logger.info('user:', req.body.username);

    user.save(function(err, user) {

        if (err) next(err);

        req.login(user, function(err) {
            if (err) next(err);
            res
                .cookie('username', req.body.username)
                .end(req.body.username);
        });
    });
});

router.get('/logout', function(req, res, next) {

    req.logout();
    res.redirect('/');

});


module.exports = router;