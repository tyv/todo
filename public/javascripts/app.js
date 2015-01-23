(function($, window, riot) {

    $.get('/todo')
        .done(function(data) {
            riot.mount('todo-app', { todo: data });
            console.log(data);
        })
        .fail(function() {
            console.log('fail');
            riot.mount('login-form');
        });

})(jQuery, window, riot);