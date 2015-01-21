var express = require('express'),
    router = express.Router(),
    path = require('path'),
    Todo = require(path.resolve(global.appRoot, 'libs/TodoSchema'));

/*
    GET
    todo list @ /todo
*/
router.get('/', function(req, res, next) {

    Todo.find(function (err, todos) {

        if (err) return next(err);
        res.json(todos);

    });
});

/*
    GET
    todo list @ /todo/todoID
*/
router.get('/:id', function(req, res, next) {

    Todo.findById(req.params.id, function (err, todo) {

        if (err) return next(err);
        res.json(todo);

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
    PUT
    update todo @ /todo/todoID
    Schema @ libs/TodoSchema.js
*/
router.put('/:id', function(req, res, next) {

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

    Todo.findByIdAndRemove(req.params.id, function (err, deleted) {

        if (err) return next(err);
        res.json(deleted);

    });
});

module.exports = router;