riot.tag('todo-app', '<form onsubmit="{ add }" class="add"> <div class="add__left"> <input name="add__input" class="add__input" required> </div> <div class="add__right"> <button type="submit" name="add_submit" class="add__submit">Add Todo</button> </div> </form> <ul class="{ block + \'__list\' }" if="{ todos.length }"> <li class="{ block + \'__item\' }" each="{ todos }"> <label><input class="checkbox" type="checkbox" __checked="{ completed }">{ name }</label> </li> </ul> <div class="{ block + \'__foot\' }"> <ul> <li class="{ block + \'__info\' }"> { getLeftString() } </li> <li><a class="{ disabled: !undone.length }" onclick="{ markAllComplete }" href="">Mark all as complete</a></li> </ul> </div>', function(opts) {
    var that = initFunctions.call(this);

    this.block = 'todo-app';
    this.todos = opts.todos;
    this.undone = this.getUndone();

    function initFunctions() {

        this.add = function() {
            var that = this,
                data = {
                    name: this.add__input.value,
                    author: 'tyv',
                    updated: Date.now()
                };

            $.post('/todo', data)
                .done(function(data) {
                    console.log('done: ', data);
                    that.onAddTodoSuccess(data);

                })
                .fail(function(e) { console.log('fail: ', e) });
        }

        this.onAddTodoSuccess = function(data) {

            this.todos.push(data);
            this.undone = this.getUndone();
            this.update();

        }

        this.markAllComplete = function() {
            this.todos.forEach(function(todo) {
                todo.completed = true;
            });
            this.undone = this.getUndone();
        }

        this.getUndone = function() {
            return this.todos.filter(function(todo) {
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