<login-form>

    <header class="header ruler">
        <h1 class="header__h1">Sign in/up</h1>
    </header>

    <form onsubmit={ submit }
            class="login"
            id="login-form"
            name="login"
            action="/123"
            disabled={ disabled }>

        <ul class="login__chooser">
            <li class="login__chooser-item" each={ fields }>
                <input
                    class="custom-input custom-input_type_radio"
                    id={ value.toLowerCase() }
                    onclick={ !checked && parent.toggle }
                    type="radio"
                    name="chooser"
                    checked={ checked }
                    disabled={ parent.disabled }
                ><label class="custom-input__label" for={ value.toLowerCase() }><i class="custom-input__icon"></i>{ value }</label>
            </li>
        </ul>


        <div class="login__line">
            <input
                class="custom-input custom-input_type_text"
                name="username"
                placeholder="Login"
                disabled={ disabled }
                required
            >
        </div>

        <div class="login__line">
            <input
                class="custom-input custom-input_type_text"
                type="password"
                name="password"
                placeholder="Password"
                disabled={ disabled }
                required
            >
        </div>
        <div class="login__submit">
            <div class="login__submit-">
                <button
                    class="custom-input custom-input_type_button custom-input_action_submit"
                    type="submit"
                    disabled={ disabled }>{fields[0].checked ? fields[0].value : fields[1].value}
                </button>
            </div>

            <div class="login__submit-">
                <button
                    class="custom-input custom-input_type_button"
                    type="reset"
                    disabled={ disabled }>Clear
                </button>
            </div>
        </div>
    </form>

    this.fields = [{
        value: 'Login',
        checked: true
    },{
        value: 'Register'
    }];

    toggle(e) {

        this.fields.forEach(function(field) {
            field.checked = !field.checked;
        });

        return true;
    }


    submit(e) {
        var url = '/passport';

        if (this.fields[1].checked) url += '/register';

        this.disabled = true;

        $.post(url, $(this['login-form']).serialize())
            .done(this.onLogin.bind(this))
            .fail(this.onLoginFail.bind(this));
    }

    onLogin(username) {

        commonData.login = username;

        todoAPI
            .getTodos()
                .done(function(todos) {
                    riot.mount('todo-app', { todos: todos });
                    $(this.root).remove();
                    riot.update();
                }.bind(this))
                .fail(function() {
                    conole.log('data retirieve fail');
                })
    }

    onLoginFail(e) {
        console.log('fail', e);
    }

</login-form>

