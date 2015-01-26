ym.modules.define(
    'commonData',
    ['jquery'],
    function(provide, $) {

        provide({
            login: $.cookie('username') || undefined,
            apiUrl: '/todo'
        });

    });