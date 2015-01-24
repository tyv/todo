// TODO: use module system instead global scope
getTodos()
    .done(function(data) {
        console.log(data);
        riot.mount('todo-app', { todos: data });
    })
    .fail(function() {
        console.log('fail');
        riot.mount('login-form');
    });



function getTodos() {
    return $.get('/todo');
}
