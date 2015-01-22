(function($, window, riot) {

    riot.mount('login-form', {
        host: 'http://localhost:3000/',
        login: 'passport',
        register: 'passport/register'
    });

})(jQuery, window, riot);