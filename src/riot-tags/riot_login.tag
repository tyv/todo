<login-form>
    <form id="login" onsubmit={ submit } name="login" action="/123" disabled={ disabled }>

        <ul>
            <li each={ fields }>
              <label>
                <input
                    onclick={ parent.toggle }
                    type="radio"
                    name={ value.toLowerCase() }
                    checked={ checked }
                    disabled={ parent.disabled }
                >
                { value }
              </label>
            </li>
        </ul>

        <input name="username" placeholder="login"  disabled={ disabled } required>
        <input type="password" name="password" placeholder="password" disabled={ disabled } required>

        <div class="submit">
            <button type="submit" disabled={ disabled }>{fields[0].checked ? fields[0].value : fields[1].value}</button>
            <button type="reset" disabled={ disabled }>Clear</button>
        </div>
    </form>

    this.fields = [{
        value: 'Login',
        checked: true
    },{
        value: 'Register'
    }];

    toggle() {

        this.fields.forEach(function(field) {
            field.checked = !field.checked;
        });

        return true;
    }


    submit(e) {
        var url = '/passport';

        if (this.fields[1].checked) url += '/register';

        this.disabled = true;

        $.post(url, $(this.login).serialize())
            .done(this.onLogin.bind(this))
            .fail(this.onLoginFail.bind(this));
    }

    onLogin(username) {

        commonData.login = username;

        TodoAPI
            .getTodos()
                .done(function(todos) {
                    riot.mount('todo-app', { todos: todos });
                    $(this.root).remove();
                }.bind(this))
                .fail(function() {
                    conole.log('data retirieve fail');
                })
    }

    onLoginFail(e) {
        console.log('fail', e);
    }

</login-form>

