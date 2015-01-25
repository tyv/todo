modules.define(
    'todoApi',
    ['jquery', 'commonData'],
    function(provide, $, commonData) {

        provide({

            getTodos: function() {
                return $.get(commonData.apiUrl);
            },

            addTodo: function(todo) {
                return $.post(commonData.apiUrl, todo);
            },

            updateTodos: function(todos) {
                return $.ajax({
                  type: 'POST',
                  contentType : 'application/json',
                  url: commonData.apiUrl + '/bulk',
                  data: JSON.stringify(todos),
                  dataType: 'json'
                });
            },

            updateTodo: function(todo) {
                return $.ajax({
                    url: commonData.apiUrl + '/' + todo._id,
                    type: 'PUT',
                    data: todo
                });
            },

            deleteTodo: function(id) {
                return $.ajax({
                    url: commonData.apiUrl + '/' + id,
                    type: 'DELETE',
                    data: {
                        id: id,
                        author: commonData.login
                    }
                });
            }
        });
    });