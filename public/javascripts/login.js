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

  this.onLogin = function(data) {
        riot.mount('todo-app', { todo: data });
        $(this.root).remove();
    }.bind(this)

  this.onLoginFail = function(e) {
        console.log('fail', e);
    }.bind(this)

})

