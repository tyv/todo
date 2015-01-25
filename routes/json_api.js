var express = require('express'),
    router = express.Router(),
    path = require('path'),
    logger = require(path.resolve(global.appRoot, 'libs/logger')),
    mustAuthenticated = require(path.resolve(global.appRoot, 'libs/must-authenticated')),
    Todo = require(path.resolve(global.appRoot, 'libs/TodoSchema')),
    Vow = require('vow');


router.all('/', mustAuthenticated);

/*
    GET
    todo list @ /todo
*/
router.get('/', function(req, res, next) {

    Todo.find({ author: req.user.username }, function (err, todos) {

        if (err) return next(err);
        res.json(todos);

    });
});

/*
    POST
    add todo @ /todo
    Schema @ libs/TodoSchema.js
*/
router.post('/', function(req, res, next) {

    Todo.create(req.body, function (err, added) {

        if (err) return next(err);
        res.json(added);

    });
});

/*
    POST
    bulk update todos @ /todo/bulk
    Schema @ libs/TodoSchema.js
*/
router.post('/bulk', function(req, res, next) {

    Vow.all(req.body.map(function(todo) {

        var deffered = Vow.defer();

        Todo.findByIdAndUpdate(todo._id, todo, function (err, updated) {

            if (err) deffered.reject(err);
            deffered.resolve(updated)

        });

        return deffered.promise();

    })).then(function(allUpdated) {

            logger.info('bulk update done!');
            res.end(JSON.stringify(allUpdated));

        }, function(err) {

            logger.error(err);
            res.next(err)

        });

});

/*
    PUT
    update todo @ /todo/todoID
    Schema @ libs/TodoSchema.js
*/
router.put('/:id', function(req, res, next) {

    if (req.body.author != req.user.username) res.status(401).end();

    Todo.findByIdAndUpdate(req.params.id, req.body, function (err, updated) {

        if (err) return next(err);
        res.json(updated);

    });
});

/*
    DELETE
    delete todo @ /todo
    Schema @ libs/TodoSchema.js
*/
router.delete('/:id', function(req, res, next) {

    var body = req.body;
    console.log('DELETE:', body);

    Todo.findOneAndRemove({ _id: body.id, author: body.author }, function (err, deleted) {
        console.log('deleted:', deleted);
        if (err) return next(err);

        if (deleted) {
            res.json(deleted);
        } else {
            res.status(404).end();
        }

    });
});

module.exports = router;