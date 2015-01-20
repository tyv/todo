var express = require('express'),
    router = express.Router(),
    path = require('path'),
    Todo = require(path.resolve(global.appRoot, 'libs/TodoSchema'));

// GET
router.get('/', function(req, res, next) {

    Todo.find(function (err, todos) {

        if (err) return next(err);
        res.json(todos);

    });
});

router.get('/:id', function(req, res, next) {

    Todo.findById(req.params.id, function (err, post) {

        if (err) return next(err);
        res.json(post);

    });
});


// POST
router.post('/', function(req, res, next) {

    Todo.create(req.body, function (err, post) {

        if (err) return next(err);
        res.json(post);

    });
});

// PUT (update) /todo/:id
router.put('/:id', function(req, res, next) {

    Todo.findByIdAndUpdate(req.params.id, req.body, function (err, post) {

        if (err) return next(err);
        res.json(post);

    });
});

// DELETE /todo/:id
router.delete('/:id', function(req, res, next) {

    Todo.findByIdAndRemove(req.params.id, function (err, post) {

        if (err) return next(err);
        res.json(post);

    });
});


module.exports = router;
