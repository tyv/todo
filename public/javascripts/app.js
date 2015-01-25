// TODO: use module system instead global scope
var globalData = {
    login: $.cookie('username') || undefined,
    apiUrl: '/todo'
};


TodoAPI = {

    getTodos: function() {
        return $.get(globalData.apiUrl);
    },

    addTodo: function(todo) {
        return $.post(globalData.apiUrl, todo);
    },

    updateTodos: function(todos) {
        return $.ajax({
          type: 'POST',
          contentType : 'application/json',
          url: globalData.apiUrl + '/bulk',
          data: JSON.stringify(todos),
          dataType: 'json'
        });
    },

    updateTodo: function(todo) {
        return $.ajax({
            url: globalData.apiUrl + '/' + todo._id,
            type: 'PUT',
            data: todo
        });
    },

    deleteTodo: function(id) {
        return $.ajax({
            url: globalData.apiUrl + '/' + id,
            type: 'DELETE',
            data: {
                id: id,
                author: globalData.login
            }
        });
    }
};

TodoAPI
    .getTodos()
        .done(function(data) {
            riot.mount('todo-app', { todos: data });
        })
        .fail(function() {
            console.log('fail get data, rendering login form...');
            riot.mount('login-form');
        });

