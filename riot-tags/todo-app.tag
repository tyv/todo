<todo-app class={ block }>

    <div class="add">

        <div class="add__left">
            <input class="add__input" name="add">
        </div>

        <div class="add__right">
            <button class="add__submit">Add Todo</button>
        </div>

    </div>

    <ul class={ block + '__list' } if={ todos.length }>
        <li class={ block + '__item' } each={ todos }>
            <label><input class="checkbox" type="checkbox" checked={ completed }>{ name }</label>
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
    this.undone = this.getUndone();

    function initFunctions() {

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
                    leftString = undoneLength + ' ' + leftString.replace('&', 's');
            }

            return leftString;
        }

        return this;

    };

</todo-app>