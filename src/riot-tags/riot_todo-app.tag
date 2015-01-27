<todo-app class="todo-app">

    <header class="header ruler">
        <h1 class="header__h1">Todos for { login }</h1>
    </header>


    <form onsubmit={ add } class="add">
        <div class="add__col">
            <input
                class="custom-input custom-input_type_text"
                name="add__input"
                class="add__input"
                placeholder="What needs to be done?"
                required>
        </div>

        <div class="add__col">
            <button
                class="custom-input custom-input_type_button"
                type="submit"
                name="add_submit"
                class="add__submit">Add Todo</button>
        </div>
    </form>

    <ul class="todo-app__list ruler" if={ todos.length }>
        <li class="todo-app__item" each={ todos }>
            <input
                onchange={ parent.toggle }
                class="custom-input custom-input_type_checkbox"
                id={ _id }
                type="checkbox"
                checked={ completed }>
            <label
                class="custom-input__label"
                for={ _id }>
                    <i class="custom-input__icon"></i
                    >{ name }

                    <a
                        class="todo-app__delete"
                        onclick={ parent.delete }
                        href>×</a>

                    <i class="drag"></i>
                </label>
        </li>
    </ul>

    <div class="todo-app__foot">
        <ul class="todo-app__foot-list">
            <li class="todo-app__info">
                { getLeftString() }
            </li>
            <li><a
                    class={ 'todo-app__markall': true, disabled: !undone.length }
                    onclick={ markAllComplete } href="">Mark all as complete</a>
            </li>
        </ul>
    </div>

    var that = initFunctions.call(this);

    this.todos = opts.todos;
    this.login = commonData.login || 'username';
    this.getUndone();

    this.on('mount', function() {
        var $list = $('.todo-app__list'),
            $items = $list.find('.todo-app__item');


            $list.dragsort({
                dragSelector: '.drag',
                dragEnd: that.onDragEnd
            });


        this.todos.forEach(function(todo, index) {
            $($items[index]).data('todo', todo);
        })
    });

    function initFunctions() {

        this.add = function() {

            var that = this,
                data = {
                    name: this.add__input.value,
                    author: commonData.login,
                    order: this.getHighestOrder() + 1,
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
            this.add__input.value = '';
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
                .done(function(todos) { that.onBulkUpdate(todos) })
                .fail(function(e) { that.onBulkUpdateFail(e) })

        }

        this.onBulkUpdate = function(todos) {
            this.todos = todos;
            this.getUndone();
            this.update();
        }

        this.onBulkUpdateFail = function(e) {
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
            this.getUndone();
            this.update();
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

        this.onDragEnd = function() {
            var newTodos = [],
                $items = $('.todo-app__item');

            $items.each(function(index) {
                var todo = $(this).data('todo');
                todo.order = index + 1;
                newTodos.push(todo);
            });

            todoAPI
                .updateTodos(newTodos)
                .done(function(todos) { that.onBulkUpdate(todos) })
                .fail(function(e) { that.onBulkUpdateFail(e) })
        }

        this.getHighestOrder = function() {
            var highestOrder = 0;

            this.todos.forEach(function(todo) {

                if (todo.order > highestOrder) {
                    highestOrder = todo.order;
                }
            });

            return highestOrder;
        }

        return this;

    };

</todo-app>