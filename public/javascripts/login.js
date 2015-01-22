riot.tag('login-form', '<form name="login"> <fieldset title="Login"> <chooser fields="{ fields }"></chooser> <input placeholder="login"> <input type="password" placeholder="password"> <div class="submit"> <input type="submit" value="{ fields[0].checked ? fields[0].value : fields[1].value}"> </div> </fieldset> </form>', function(opts) {
    this.fields = [{
        value: 'Login',
        checked: true
    },{
        value: 'Register'
    }];

})

riot.tag('chooser', '<ul> <li each="{ fields }"> <label> <input onclick="{ parent.toggle }" type="radio" name="chooser" __checked="{ checked }"> { value } </label> </li> </ul>', function(opts) {
    var parent = this.parent;

    this.fields = opts.fields;

    this.toggle = function() {

        opts.fields.forEach(function(field) {
            field.checked = !field.checked;

        });

        parent.update();

        return true;
    }

})
