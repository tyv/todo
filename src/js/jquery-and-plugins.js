modules.define(
    'jquery',
    ['basket'],
    function(provide, basket) {

        basket
            .require({
                url: 'http://yastatic.net/jquery/2.1.3/jquery.min.js',
                key: 'jquery',
            })
            .then(function() {
                basket.require({
                    url: 'http://yastatic.net/jquery/cookie/1.0/jquery.cookie.min.js',
                    key: 'jquery_cookie',
                })
            })

        provide(jQuery.noConflict(true));

    });