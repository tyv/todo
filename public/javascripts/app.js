(function($, window, riot) {

    $.get('/todo')
        .done(function(data) {
            console.log(data)
            riot.mount('todo-app', { todos: data });
            console.log(data);
        })
        .fail(function() {
            console.log('fail');
            riot.mount('login-form');
        });

})(jQuery, window, riot);