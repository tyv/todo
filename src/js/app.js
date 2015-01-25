modules.require(
    ['jquery', 'riot', 'todoApi'],
    function($, riot, todoApi) {

        todoAPI
            .getTodos()
                .done(function(data) {
                    riot.mount('todo-app', { todos: data });
                })
                .fail(function() {
                    console.log('fail get data, rendering login form...');
                    riot.mount('login-form');
                });
    });