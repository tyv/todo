<todo-app class={ block }>

    <form onsubmit={ add } class="add">
        <div class="add__left">
            <input name="add__input" class="add__input" required>
        </div>

        <div class="add__right">
            <button type="submit" name="add_submit" class="add__submit">Add Todo</button>
        </div>
    </form>

    <ul class={ block + '__list' } if={ todos.length }>
        <li class={ block + '__item' } each={ todos }>
            <label>
                <input
                        onchange={ parent.toggle }
                        class="checkbox"
                        type="checkbox"
                        checked={ completed }>{ name }
            </label>
            <a onclick={ parent.delete } href>×</a>
        </li>
    </ul>

    <div class={ block + '__foot' }>
        <ul>
            <li class={ block + '__info' }>
                { getLeftString() }
            </li>
            <li><a class={ disabled: !undone.length } onclick={ markAllComplete } href="">Mark all as complete</a></li>
        </ul>
    </div>

    var that = initFunctions.call(this);

    this.block = 'todo-app';
    this.todos = opts.todos;
    this.getUndone();

    function initFunctions() {

        this.add = function() {
             //TODO fix 'author'
            var that = this,
                data = {
                    name: this.add__input.value,
                    author: globalData.login,
                    updated: Date.now()
                };

            TodoAPI
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

            TodoAPI
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

            TodoAPI
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

            TodoAPI
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

</todo-app>