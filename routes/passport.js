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

            logger.info('11111');
            logger.info('user:', user);

            if (err) next(err);

            if (user) {

                req.logIn(user, function(err) {

                  if (err) next(err);
                  res.json(res);

                });

            } else {
                next(err);
            }
        }
    )(req, res, next)
});


/*
    POST
    login @ /passoport/register
*/
router.post('/register', function(req, res, next) {

    var user = new User({ username: req.body.email, password: req.body.password });

    logger.info('Register attempt');
    logger.info('user:', req.body.email);

    user.save(function(err, user) {

        if (err) next(err);

        req.login(user, function(err, user) {
            if (err) next(err);
            res.json(user);
        });
    });
});



module.exports = router;