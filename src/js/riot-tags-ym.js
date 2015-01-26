ym.modules.require(
  ['jquery', 'todoAPI', 'commonData', 'riot'],
  function($, todoAPI, commonData, riot) {
    riot.tag('login-form', '<form id="login" onsubmit="{ submit }" name="login" action="/123" __disabled="{ disabled }"> <ul> <li each="{ fields }"> <label> <input onclick="{ parent.toggle }" type="radio" name="{ value.toLowerCase() }" __checked="{ checked }" __disabled="{ parent.disabled }" > { value } </label> </li> </ul> <input name="username" placeholder="login" __disabled="{ disabled }" required> <input type="password" name="password" placeholder="password" __disabled="{ disabled }" required> <div class="submit"> <button type="submit" __disabled="{ disabled }">{fields[0].checked ? fields[0].value : fields[1].value}</button> <button type="reset" __disabled="{ disabled }">Clear</button> </div> </form>', function(opts) {
        this.fields = [{
            value: 'Login',
            checked: true
        },{
            value: 'Register'
        }];
    
      this.toggle = function() {
    
            this.fields.forEach(function(field) {
                field.checked = !field.checked;
            });
    
            return true;
        }.bind(this)
    
    
      this.submit = function(e) {
            var url = '/passport';
    
            if (this.fields[1].checked) url += '/register';
    
            this.disabled = true;
    
            $.post(url, $(this.login).serialize())
                .done(this.onLogin.bind(this))
                .fail(this.onLoginFail.bind(this));
        }.bind(this)
    
      this.onLogin = function(username) {
    
            commonData.login = username;
    
            todoAPI
                .getTodos()
                    .done(function(todos) {
                        riot.mount('todo-app', { todos: todos });
                        $(this.root).remove();
                    }.bind(this))
                    .fail(function() {
                        conole.log('data retirieve fail');
                    })
        }.bind(this)
    
      this.onLoginFail = function(e) {
            console.log('fail', e);
        }.bind(this)
    
    })
    
    
    riot.tag('todo-app', '<form onsubmit="{ add }" class="add"> <div class="add__left"> <input name="add__input" class="add__input" required> </div> <div class="add__right"> <button type="submit" name="add_submit" class="add__submit">Add Todo</button> </div> </form> <ul class="{ block + \'__list\' }" if="{ todos.length }"> <li class="{ block + \'__item\' }" each="{ todos }"> <label> <input onchange="{ parent.toggle }" class="checkbox" type="checkbox" __checked="{ completed }">{ name } </label> <a onclick="{ parent.delete }" href>×</a> </li> </ul> <div class="{ block + \'__foot\' }"> <ul> <li class="{ block + \'__info\' }"> { getLeftString() } </li> <li><a class="{ disabled: !undone.length }" onclick="{ markAllComplete }" href="">Mark all as complete</a></li> </ul> </div>', function(opts) {
        var that = initFunctions.call(this);
    
        this.block = 'todo-app';
        this.todos = opts.todos;
        this.getUndone();
    
        function initFunctions() {
    
            this.add = function() {
    
                var that = this,
                    data = {
                        name: this.add__input.value,
                        author: commonData.login,
                        updated: Date.now()
                    };
    
                todoAPI
                    .addTodo(data)
                        .done(function(data) {
                            console.log('done: ', data);
                            that.onAddTodoSuccess(data);
    
                        })
                        .fail(function(e) {
                            console.log('fail: ', e)
                        });
            }
    
            this.onAddTodoSuccess = function(data) {
    
                this.todos.push(data);
                this.getUndone();
                this.update();
    
            }
    
            this.markAllComplete = function() {
    
                var that = this,
                    todos = this.todos.map(function(todo) {
                                todo.completed = true;
                                return todo;
                            });
    
                todoAPI
                    .updateTodos(todos)
                    .done(function(todos) { that.markAllCompleteSuccess(todos) })
                    .fail(function(e) { that.markAllCompleteFail(e) })
    
            }
    
            this.markAllCompleteSuccess = function(todos) {
                this.todos = todos;
                this.getUndone();
            }
    
            this.markAllCompleteFail = function(e) {
                console.log('error bulk change', e);
            }
    
            this.toggle = function(e) {
    
                var that = this.parent,
                    todo = $.extend({}, e.item);
    
                todo.completed = !todo.completed;
    
                todoAPI
                    .updateTodo(todo)
                    .done(function(todo) {
                        that.toggleSuccess(todo, e.item)
                    })
                    .fail(function(e) {
                        that.toggleFail(e)
                    })
            }
    
            this.toggleSuccess = function(todo, item) {
                item.completed = todo.completed;
            }
    
            this.toggleFail = function(e) {
                console.log('toggle fail: ', e);
            }
    
            this.delete = function(e) {
    
                todoAPI
                    .deleteTodo(e.item._id)
                    .done(function() {
                        that.deleteSuccess(e.item)
                    })
                    .fail(function(e) {
                        that.deleteFail(e)
                    })
            }
    
            this.deleteSuccess = function(item) {
                this.todos.splice(this.todos.indexOf(item), 1);
                this.getUndone();
                this.update();
            }
    
            this.deleteFail = function(e) {
                console.log('delete fail: ', e);
            }
    
            this.getUndone = function() {
                this.undone = this.todos.filter(function(todo) {
                    return !todo.completed
                });
            }
    
            this.getLeftString = function() {
                var leftString = '% item& left';
                    undoneLength = this.undone.length;
    
                switch(undoneLength) {
                    case 0:
                        leftString = 'All done';
                        break;
    
                    case 1:
                        leftString = leftString.replace('%', '1').replace('&', '');
                        break;
    
                    default:
                        leftString = leftString.replace('%', undoneLength).replace('&', 's');
                }
    
                return leftString;
            }
    
            return this;
    
        };
    
    })


  });