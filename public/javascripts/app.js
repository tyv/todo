(function (global){
var _backupGlobalModules = global.modules;
/**
 * Modules
 *
 * Copyright (c) 2013 Filatov Dmitry (dfilatov@yandex-team.ru)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * @version 0.1.0
 */

(function(global) {

    var undef,

        DECL_STATES = {
            NOT_RESOLVED : 'NOT_RESOLVED',
            IN_RESOLVING : 'IN_RESOLVING',
            RESOLVED     : 'RESOLVED'
        },

        /**
         * Creates a new instance of modular system
         * @returns {Object}
         */
            create = function() {
            var curOptions = {
                    trackCircularDependencies : true,
                    allowMultipleDeclarations : true
                },

                modulesStorage = {},
                waitForNextTick = false,
                pendingRequires = [],

                /**
                 * Defines module
                 * @param {String} name
                 * @param {String[]} [deps]
                 * @param {Function} declFn
                 */
                    define = function(name, deps, declFn) {
                    if(!declFn) {
                        declFn = deps;
                        deps = [];
                    }

                    var module = modulesStorage[name];
                    if(!module) {
                        module = modulesStorage[name] = {
                            name : name,
                            decl : undef
                        };
                    }

                    module.decl = {
                        name       : name,
                        prev       : module.decl,
                        fn         : declFn,
                        state      : DECL_STATES.NOT_RESOLVED,
                        deps       : deps,
                        dependents : [],
                        exports    : undef
                    };
                },

                /**
                 * Requires modules
                 * @param {String|String[]} modules
                 * @param {Function} cb
                 * @param {Function} [errorCb]
                 */
                    require = function(modules, cb, errorCb) {
                    if(typeof modules === 'string') {
                        modules = [modules];
                    }

                    if(!waitForNextTick) {
                        waitForNextTick = true;
                        nextTick(onNextTick);
                    }

                    pendingRequires.push({
                        deps : modules,
                        cb   : function(exports, error) {
                            error?
                                (errorCb || onError)(error) :
                                cb.apply(global, exports);
                        }
                    });
                },

                /**
                 * Returns state of module
                 * @param {String} name
                 * @returns {String} state, possible values are NOT_DEFINED, NOT_RESOLVED, IN_RESOLVING, RESOLVED
                 */
                    getState = function(name) {
                    var module = modulesStorage[name];
                    return module?
                        DECL_STATES[module.decl.state] :
                        'NOT_DEFINED';
                },

                /**
                 * Returns whether the module is defined
                 * @param {String} name
                 * @returns {Boolean}
                 */
                    isDefined = function(name) {
                    return !!modulesStorage[name];
                },

                /**
                 * Sets options
                 * @param {Object} options
                 */
                    setOptions = function(options) {
                    for(var name in options) {
                        if(options.hasOwnProperty(name)) {
                            curOptions[name] = options[name];
                        }
                    }
                },

                onNextTick = function() {
                    waitForNextTick = false;
                    applyRequires();
                },

                applyRequires = function() {
                    var requiresToProcess = pendingRequires,
                        i = 0, require;

                    pendingRequires = [];

                    while(require = requiresToProcess[i++]) {
                        requireDeps(null, require.deps, [], require.cb);
                    }
                },

                requireDeps = function(fromDecl, deps, path, cb) {
                    var unresolvedDepsCnt = deps.length;
                    if(!unresolvedDepsCnt) {
                        cb([]);
                    }

                    var decls = [],
                        i = 0, len = unresolvedDepsCnt,
                        dep, decl;

                    while(i < len) {
                        dep = deps[i++];
                        if(typeof dep === 'string') {
                            if(!modulesStorage[dep]) {
                                cb(null, buildModuleNotFoundError(dep, fromDecl));
                                return;
                            }

                            decl = modulesStorage[dep].decl;
                        }
                        else {
                            decl = dep;
                        }

                        if(decl.state === DECL_STATES.IN_RESOLVING &&
                            curOptions.trackCircularDependencies &&
                            isDependenceCircular(decl, path)) {
                            cb(null, buildCircularDependenceError(decl, path));
                            return;
                        }

                        decls.push(decl);

                        startDeclResolving(
                            decl,
                            path,
                            function(_, error) {
                                if(error) {
                                    cb(null, error);
                                    return;
                                }

                                if(!--unresolvedDepsCnt) {
                                    var exports = [],
                                        i = 0, decl;
                                    while(decl = decls[i++]) {
                                        exports.push(decl.exports);
                                    }
                                    cb(exports);
                                }
                            });
                    }
                },

                startDeclResolving = function(decl, path, cb) {
                    if(decl.state === DECL_STATES.RESOLVED) {
                        cb(decl.exports);
                        return;
                    }
                    else {
                        decl.dependents.push(cb);
                    }

                    if(decl.state === DECL_STATES.IN_RESOLVING) {
                        return;
                    }

                    if(decl.prev && !curOptions.allowMultipleDeclarations) {
                        provideError(decl, buildMultipleDeclarationError(decl));
                        return;
                    }

                    curOptions.trackCircularDependencies && (path = path.slice()).push(decl);

                    var isProvided = false,
                        deps = decl.prev? decl.deps.concat([decl.prev]) : decl.deps;

                    decl.state = DECL_STATES.IN_RESOLVING;
                    requireDeps(
                        decl,
                        deps,
                        path,
                        function(depDeclsExports, error) {
                            if(error) {
                                provideError(decl, error);
                                return;
                            }

                            depDeclsExports.unshift(function(exports, error) {
                                if(isProvided) {
                                    cb(null, buildDeclAreadyProvidedError(decl));
                                    return;
                                }

                                isProvided = true;
                                error?
                                    provideError(decl, error) :
                                    provideDecl(decl, exports);
                            });

                            decl.fn.apply(
                                {
                                    name   : decl.name,
                                    deps   : decl.deps,
                                    global : global
                                },
                                depDeclsExports);
                        });
                },

                provideDecl = function(decl, exports) {
                    decl.exports = exports;
                    decl.state = DECL_STATES.RESOLVED;

                    var i = 0, dependent;
                    while(dependent = decl.dependents[i++]) {
                        dependent(exports);
                    }

                    decl.dependents = undef;
                },

                provideError = function(decl, error) {
                    decl.state = DECL_STATES.NOT_RESOLVED;

                    var i = 0, dependent;
                    while(dependent = decl.dependents[i++]) {
                        dependent(null, error);
                    }

                    decl.dependents = [];
                };

            return {
                create     : create,
                define     : define,
                require    : require,
                getState   : getState,
                isDefined  : isDefined,
                setOptions : setOptions
            };
        },

        onError = function(e) {
            nextTick(function() {
                throw e;
            });
        },

        buildModuleNotFoundError = function(name, decl) {
            return Error(decl?
                'Module "' + decl.name + '": can\'t resolve dependence "' + name + '"' :
                'Required module "' + name + '" can\'t be resolved');
        },

        buildCircularDependenceError = function(decl, path) {
            var strPath = [],
                i = 0, pathDecl;
            while(pathDecl = path[i++]) {
                strPath.push(pathDecl.name);
            }
            strPath.push(decl.name);

            return Error('Circular dependence has been detected: "' + strPath.join(' -> ') + '"');
        },

        buildDeclAreadyProvidedError = function(decl) {
            return Error('Declaration of module "' + decl.name + '" has already been provided');
        },

        buildMultipleDeclarationError = function(decl) {
            return Error('Multiple declarations of module "' + decl.name + '" have been detected');
        },

        isDependenceCircular = function(decl, path) {
            var i = 0, pathDecl;
            while(pathDecl = path[i++]) {
                if(decl === pathDecl) {
                    return true;
                }
            }
            return false;
        },

        nextTick = (function() {
            var fns = [],
                enqueueFn = function(fn) {
                    return fns.push(fn) === 1;
                },
                callFns = function() {
                    var fnsToCall = fns, i = 0, len = fns.length;
                    fns = [];
                    while(i < len) {
                        fnsToCall[i++]();
                    }
                };

            if(typeof process === 'object' && process.nextTick) { // nodejs
                return function(fn) {
                    enqueueFn(fn) && process.nextTick(callFns);
                };
            }

            if(global.setImmediate) { // ie10
                return function(fn) {
                    enqueueFn(fn) && global.setImmediate(callFns);
                };
            }

            if(global.postMessage && !global.opera) { // modern browsers
                var isPostMessageAsync = true;
                if(global.attachEvent) {
                    var checkAsync = function() {
                        isPostMessageAsync = false;
                    };
                    global.attachEvent('onmessage', checkAsync);
                    global.postMessage('__checkAsync', '*');
                    global.detachEvent('onmessage', checkAsync);
                }

                if(isPostMessageAsync) {
                    var msg = '__modules' + (+new Date()),
                        onMessage = function(e) {
                            if(e.data === msg) {
                                e.stopPropagation && e.stopPropagation();
                                callFns();
                            }
                        };

                    global.addEventListener?
                        global.addEventListener('message', onMessage, true) :
                        global.attachEvent('onmessage', onMessage);

                    return function(fn) {
                        enqueueFn(fn) && global.postMessage(msg, '*');
                    };
                }
            }

            var doc = global.document;
            if('onreadystatechange' in doc.createElement('script')) { // ie6-ie8
                var head = doc.getElementsByTagName('head')[0],
                    createScript = function() {
                        var script = doc.createElement('script');
                        script.onreadystatechange = function() {
                            script.parentNode.removeChild(script);
                            script = script.onreadystatechange = null;
                            callFns();
                        };
                        head.appendChild(script);
                    };

                return function(fn) {
                    enqueueFn(fn) && createScript();
                };
            }

            return function(fn) { // old browsers
                enqueueFn(fn) && setTimeout(callFns, 0);
            };
        })();

    if(typeof exports === 'object') {
        module.exports = create();
    }
    else {
        global.modules = create();
    }

})(this);
var ym = global["ym"] = { modules: global.modules };
global.modules = _backupGlobalModules; _backupGlobalModules = undefined;
ym.modules.setOptions({
    trackCircularDependencies: true,
    allowMultipleDeclarations: false
});
ym.modules.require(
    ['jquery', 'riot', 'todoAPI'],
    function($, riot, todoAPI) {

        todoAPI
            .getTodos()
                .done(function(data) {
                    riot.mount('todo-app', { todos: data });
                })
                .fail(function() {
                    console.log('fail get data, rendering login form...');
                    riot.mount('login-form');
                });
    });
ym.modules.define(
    'basket',
    ['rsvp'],
    function(provide, RSVP) {

        'use strict';

        var head = document.head || document.getElementsByTagName('head')[0];
        var storagePrefix = 'basket-';
        var defaultExpiration = 5000;

        var addLocalStorage = function( key, storeObj ) {
            try {
                localStorage.setItem( storagePrefix + key, JSON.stringify( storeObj ) );
                return true;
            } catch( e ) {
                if ( e.name.toUpperCase().indexOf('QUOTA') >= 0 ) {
                    var item;
                    var tempScripts = [];

                    for ( item in localStorage ) {
                        if ( item.indexOf( storagePrefix ) === 0 ) {
                            tempScripts.push( JSON.parse( localStorage[ item ] ) );
                        }
                    }

                    if ( tempScripts.length ) {
                        tempScripts.sort(function( a, b ) {
                            return a.stamp - b.stamp;
                        });

                        basket.remove( tempScripts[ 0 ].key );

                        return addLocalStorage( key, storeObj );

                    } else {
                        // no files to remove. Larger than available quota
                        return;
                    }

                } else {
                    // some other error
                    return;
                }
            }

        };

        var getUrl = function( url ) {
            var promise = new RSVP.Promise( function( resolve, reject ){

                var xhr = new XMLHttpRequest();
                xhr.open( 'GET', url );

                xhr.onreadystatechange = function() {
                    if ( xhr.readyState === 4 ) {
                        if( xhr.status === 200 ) {
                            resolve( {
                                content: xhr.responseText,
                                type: xhr.getResponseHeader('content-type')
                            } );
                        } else {
                            reject( new Error( xhr.statusText ) );
                        }
                    }
                };

                // By default XHRs never timeout, and even Chrome doesn't implement the
                // spec for xhr.timeout. So we do it ourselves.
                setTimeout( function () {
                    if( xhr.readyState < 4 ) {
                        xhr.abort();
                    }
                }, basket.timeout );

                xhr.send();
            });

            return promise;
        };

        var saveUrl = function( obj ) {
            return getUrl( obj.url ).then( function( result ) {
                var storeObj = wrapStoreData( obj, result );

                if (!obj.skipCache) {
                    addLocalStorage( obj.key , storeObj );
                }

                return storeObj;
            });
        };

        var wrapStoreData = function( obj, data ) {
            var now = +new Date();
            obj.data = data.content;
            obj.originalType = data.type;
            obj.type = obj.type || data.type;
            obj.skipCache = obj.skipCache || false;
            obj.stamp = now;
            obj.expire = now + ( ( obj.expire || defaultExpiration ) * 60 * 60 * 1000 );

            return obj;
        };

        var isCacheValid = function(source, obj) {
            return !source ||
                source.expire - +new Date() < 0  ||
                obj.unique !== source.unique ||
                (basket.isValidItem && !basket.isValidItem(source, obj));
        };

        var handleStackObject = function( obj ) {
            var source, promise, shouldFetch;

            if ( !obj.url ) {
                return;
            }

            obj.key =  ( obj.key || obj.url );
            source = basket.get( obj.key );

            obj.execute = obj.execute !== false;

            shouldFetch = isCacheValid(source, obj);

            if( obj.live || shouldFetch ) {
                if ( obj.unique ) {
                    // set parameter to prevent browser cache
                    obj.url += ( ( obj.url.indexOf('?') > 0 ) ? '&' : '?' ) + 'basket-unique=' + obj.unique;
                }
                promise = saveUrl( obj );

                if( obj.live && !shouldFetch ) {
                    promise = promise
                        .then( function( result ) {
                            // If we succeed, just return the value
                            // RSVP doesn't have a .fail convenience method
                            return result;
                        }, function() {
                            return source;
                        });
                }
            } else {
                source.type = obj.type || source.originalType;
                promise = new RSVP.Promise( function( resolve ){
                    resolve( source );
                });
            }

            return promise;
        };

        var injectScript = function( obj ) {
            var script = document.createElement('script');
            script.defer = true;
            // Have to use .text, since we support IE8,
            // which won't allow appending to a script
            script.text = obj.data;
            head.appendChild( script );
        };

        var handlers = {
            'default': injectScript
        };

        var execute = function( obj ) {
            if( obj.type && handlers[ obj.type ] ) {
                return handlers[ obj.type ]( obj );
            }

            return handlers['default']( obj ); // 'default' is a reserved word
        };

        var performActions = function( resources ) {
            resources.map( function( obj ) {
                if( obj.execute ) {
                    execute( obj );
                }

                return obj;
            } );
        };

        var fetch = function() {
            var i, l, promises = [];

            for ( i = 0, l = arguments.length; i < l; i++ ) {
                promises.push( handleStackObject( arguments[ i ] ) );
            }

            return RSVP.all( promises );
        };

        var thenRequire = function() {
            var resources = fetch.apply( null, arguments );
            var promise = this.then( function() {
                return resources;
            }).then( performActions );
            promise.thenRequire = thenRequire;
            return promise;
        };

        window.basket = {
            require: function() {
                var promise = fetch.apply( null, arguments ).then( performActions );

                promise.thenRequire = thenRequire;
                return promise;
            },

            remove: function( key ) {
                localStorage.removeItem( storagePrefix + key );
                return this;
            },

            get: function( key ) {
                var item = localStorage.getItem( storagePrefix + key );
                try {
                    return JSON.parse( item || 'false' );
                } catch( e ) {
                    return false;
                }
            },

            clear: function( expired ) {
                var item, key;
                var now = +new Date();

                for ( item in localStorage ) {
                    key = item.split( storagePrefix )[ 1 ];
                    if ( key && ( !expired || this.get( key ).expire <= now ) ) {
                        this.remove( key );
                    }
                }

                return this;
            },

            isValidItem: null,

            timeout: 5000,

            addHandler: function( types, handler ) {
                if( !Array.isArray( types ) ) {
                    types = [ types ];
                }
                types.forEach( function( type ) {
                    handlers[ type ] = handler;
                });
            },

            removeHandler: function( types ) {
                basket.addHandler( types, undefined );
            }
        };

        // delete expired keys
        basket.clear( true );

        provide(basket);

    });
ym.modules.define(
    'commonData',
    ['jquery'],
    function(provide, $) {

        provide({
            login: $.cookie('username') || undefined,
            apiUrl: '/todo'
        });

    });
ym.modules.define(
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
            }).then(function() {
                provide(jQuery);
            });

    });
ym.modules.require(
  ['jquery', 'todoAPI', 'commonData', 'riot'],
  function($, todoAPI, commonData, riot) {
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
    
      this.onLogin = function(username) {
    
            commonData.login = username;
    
            todoAPI
                .getTodos()
                    .done(function(todos) {
                        riot.mount('todo-app', { todos: todos });
                        $(this.root).remove();
                    }.bind(this))
                    .fail(function() {
                        conole.log('data retirieve fail');
                    })
        }.bind(this)
    
      this.onLoginFail = function(e) {
            console.log('fail', e);
        }.bind(this)
    
    })
    
    
    riot.tag('todo-app', '<form onsubmit="{ add }" class="add"> <div class="add__left"> <input name="add__input" class="add__input" required> </div> <div class="add__right"> <button type="submit" name="add_submit" class="add__submit">Add Todo</button> </div> </form> <ul class="{ block + \'__list\' }" if="{ todos.length }"> <li class="{ block + \'__item\' }" each="{ todos }"> <label> <input onchange="{ parent.toggle }" class="checkbox" type="checkbox" __checked="{ completed }">{ name } </label> <a onclick="{ parent.delete }" href>×</a> </li> </ul> <div class="{ block + \'__foot\' }"> <ul> <li class="{ block + \'__info\' }"> { getLeftString() } </li> <li><a class="{ disabled: !undone.length }" onclick="{ markAllComplete }" href="">Mark all as complete</a></li> </ul> </div>', function(opts) {
        var that = initFunctions.call(this);
    
        this.block = 'todo-app';
        this.todos = opts.todos;
        this.getUndone();
    
        function initFunctions() {
    
            this.add = function() {
    
                var that = this,
                    data = {
                        name: this.add__input.value,
                        author: commonData.login,
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
                    .done(function(todos) { that.markAllCompleteSuccess(todos) })
                    .fail(function(e) { that.markAllCompleteFail(e) })
    
            }
    
            this.markAllCompleteSuccess = function(todos) {
                this.todos = todos;
                this.getUndone();
            }
    
            this.markAllCompleteFail = function(e) {
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
    
            return this;
    
        };
    
    })


  });
ym.modules.define(
    'riot',
    function(provide) {

        /* Riot 2.0.1, @license MIT, (c) 2015 Muut Inc. + contributors */
        var riot={version:"v2.0.1"};"use strict";riot.observable=function(e){var t={};e.on=function(n,r){if(typeof r=="function"){n.replace(/\S+/g,function(e,n){(t[e]=t[e]||[]).push(r);r.typed=n>0})}return e};e.off=function(n,r){if(n=="*")t={};else if(r){var i=t[n];for(var o=0,u;u=i&&i[o];++o){if(u==r){i.splice(o,1);o--}}}else{n.replace(/\S+/g,function(e){t[e]=[]})}return e};e.one=function(t,n){if(n)n.one=1;return e.on(t,n)};e.trigger=function(n){var r=[].slice.call(arguments,1),i=t[n]||[];for(var o=0,u;u=i[o];++o){if(!u.busy){u.busy=1;u.apply(e,u.typed?[n].concat(r):r);if(u.one){i.splice(o,1);o--}u.busy=0}}return e};return e};(function(e,t){if(!this.top)return;var n=location,r=e.observable({}),i=u(),o=window;function u(){return n.hash.slice(1)}function a(e){if(e.type)e=u();if(e!=i){r.trigger.apply(null,["H"].concat(e.split("/")));i=e}}var f=e.route=function(e){if(e[0]){n.hash=e;a(e)}else{r.on("H",e)}};f.exec=function(e){e.apply(null,u().split("/"))};o.addEventListener?o.addEventListener(t,a,false):o.attachEvent("on"+t,a)})(riot,"hashchange");riot._tmpl=function(){var e={},t=/("|').+?[^\\]\1|\.\w*|\w*:|\b(?:this|true|false|null|new|typeof|Number|String|Object|Array|Math|Date)\b|([a-z_]\w*)/gi;return function(t,r){return t&&(e[t]=e[t]||n(t))(r)};function n(e,t){t=(e||"{}").replace(/\\{/g,"￰").replace(/\\}/g,"￱").split(/({[\s\S]*?})/);return new Function("d","return "+(!t[0]&&!t[2]?r(t[1]):"["+t.map(function(e,t){return t%2?r(e,1):'"'+e.replace(/\n/g,"\\n").replace(/"/g,'\\"')+'"'}).join(",")+'].join("")').replace(/\uFFF0/g,"{").replace(/\uFFF1/g,"}"))}function r(e,t){e=e.replace(/\n/g," ").replace(/^[{ ]+|[ }]+$|\/\*.+?\*\//g,"");return/^\s*[\w-"']+ *:/.test(e)?"["+e.replace(/\W*([\w-]+)\W*:([^,]+)/g,function(e,n,r){return r.replace(/\w[^,|& ]*/g,function(e){return i(e,t)})+'?"'+n+'":"",'})+'].join(" ")':i(e,t)}function i(e,n){return"(function(v){try{v="+(e.replace(t,function(e,t,n){return n?"d."+n:e})||"x")+"}finally{return "+(n?'!v&&v!==0?"":v':"v")+"}}).call(d)"}}();(function(e,t){var n=e._tmpl,r=[],i={};function o(e,t){for(var n=0;n<(e||[]).length;n++){if(t(e[n],n)===false)n--}}function u(e,t){t&&Object.keys(t).map(function(n){e[n]=t[n]});return e}function a(e,t){return e.filter(function(e){return t.indexOf(e)<0})}function f(e,t){e=t(e)===false?e.nextSibling:e.firstChild;while(e){f(e,t);e=e.nextSibling}}function l(e){var n=t.createElement("div");n.innerHTML=e;return n}function c(e,t){t.trigger("update");o(e,function(e){var r=e.tag,i=e.dom;function o(e){i.removeAttribute(e)}if(e.loop){o("each");return d(e,t)}if(r)return r.update?r.update():e.tag=s({tmpl:r[0],fn:r[1],root:i,parent:t});var u=e.attr,a=n(e.expr,t);if(a==null)a="";if(e.value===a)return;e.value=a;if(!u)return i.nodeValue=a;if(!a&&e.bool||/obj|func/.test(typeof a))o(u);if(typeof a=="function"){i[u]=function(e){e=e||window.event;e.which=e.which||e.charCode||e.keyCode;e.target=e.target||e.srcElement;e.currentTarget=i;e.item=t.__item||t;if(a.call(t,e)!==true){e.preventDefault&&e.preventDefault();e.returnValue=false}t.update()}}else if(/^(show|hide|if)$/.test(u)){o(u);if(u=="hide")a=!a;i.style.display=a?"":"none"}else{if(e.bool){if(!a)return;a=u}i.setAttribute(u,a)}});t.trigger("updated")}function p(e){var t={},n=[];f(e,function(e){var r=e.nodeType,a=e.nodeValue;function f(t,r){if(t?t.indexOf("{")>=0:r){var i={dom:e,expr:t};n.push(u(i,r||{}))}}if(r==3&&e.parentNode.tagName!="STYLE"){f(a)}else if(r==1){a=e.getAttribute("each");if(a){f(a,{loop:1});return false}var l=i[e.tagName.toLowerCase()];o(e.attributes,function(n){var r=n.name,i=n.value;if(/^(name|id)$/.test(r))t[i]=e;if(!l){var o=r.split("__")[1];f(i,{attr:o||r,bool:o});if(o){e.removeAttribute(r);return false}}});if(l)f(0,{tag:l})}});return{expr:n,elem:t}}function s(i){var a=i.opts||{},f=l(i.tmpl),s=i.root,d=i.parent,v=p(f),m={root:s,opts:a,parent:d,__item:i.item},g={};u(m,v.elem);o(s.attributes,function(e){g[e.name]=e.value});function h(){Object.keys(g).map(function(e){var t=a[e]=n(g[e],d||m);if(typeof t=="object")s.removeAttribute(e)})}h();if(!m.on){e.observable(m);delete m.off}if(i.fn)i.fn.call(m,a);m.update=function(e,n){if(d&&f&&!f.firstChild){s=d.root;f=null}if(n||t.body.contains(s)){u(m,e);u(m,m.__item);h();c(v.expr,m);!n&&m.__item&&d.update();return true}else{m.trigger("unmount")}};m.update(0,true);while(f.firstChild){if(i.before)s.insertBefore(f.firstChild,i.before);else s.appendChild(f.firstChild)}m.trigger("mount");r.push(m);return m}function d(e,t){if(e.done)return;e.done=true;var r=e.dom,i=r.previousSibling,o=r.parentNode,u=r.outerHTML,f=e.expr,l=f.split(/\s+in\s+/),c=[],p,o,d;if(l[1]){f="{ "+l[1];d=l[0].slice(1).trim().split(/,\s*/)}t.one("mount",function(){var e=r.parentNode;if(e){o=e;o.removeChild(r)}});function v(){return Array.prototype.indexOf.call(o.childNodes,i)+1}t.on("updated",function(){var e=n(f,t);is_array=Array.isArray(e);if(is_array)e=e.slice(0);else{if(!e)return;var r=JSON.stringify(e);if(r==p)return;p=r;e=Object.keys(e).map(function(t,n){var r={};r[d[0]]=t;r[d[1]]=e[t];return r})}a(c,e).map(function(e){var t=c.indexOf(e);o.removeChild(o.childNodes[v()+t]);c.splice(t,1)});a(e,c).map(function(n,r){var i=e.indexOf(n);if(d&&!p){var a={};a[d[0]]=n;a[d[1]]=r;n=a}var f=s({before:o.childNodes[v()+i],parent:t,tmpl:u,item:n,root:o});t.on("update",function(){f.update(0,true)})});c=e})}e.tag=function(e,t,n){n=n||noop,i[e]=[t,n]};e.mountTo=function(e,t,n){var r=i[t];return r&&s({tmpl:r[0],fn:r[1],root:e,opts:n})};e.mount=function(n,r){if(n=="*")n=Object.keys(i).join(", ");var u=[];o(t.querySelectorAll(n),function(t){if(t.riot)return;var n=t.tagName.toLowerCase(),i=e.mountTo(t,n,r);if(i){u.push(i);t.riot=1}});return u};e.update=function(){return r=r.filter(function(e){return!!e.update()})}})(riot,document);

        provide(riot);
    });


ym.modules.define(
    'rsvp',
    function(provide) {

            "use strict";
            function lib$rsvp$utils$$objectOrFunction(x) {
              return typeof x === 'function' || (typeof x === 'object' && x !== null);
            }

            function lib$rsvp$utils$$isFunction(x) {
              return typeof x === 'function';
            }

            function lib$rsvp$utils$$isMaybeThenable(x) {
              return typeof x === 'object' && x !== null;
            }

            var lib$rsvp$utils$$_isArray;
            if (!Array.isArray) {
              lib$rsvp$utils$$_isArray = function (x) {
                return Object.prototype.toString.call(x) === '[object Array]';
              };
            } else {
              lib$rsvp$utils$$_isArray = Array.isArray;
            }

            var lib$rsvp$utils$$isArray = lib$rsvp$utils$$_isArray;

            var lib$rsvp$utils$$now = Date.now || function() { return new Date().getTime(); };

            function lib$rsvp$utils$$F() { }

            var lib$rsvp$utils$$o_create = (Object.create || function (o) {
              if (arguments.length > 1) {
                throw new Error('Second argument not supported');
              }
              if (typeof o !== 'object') {
                throw new TypeError('Argument must be an object');
              }
              lib$rsvp$utils$$F.prototype = o;
              return new lib$rsvp$utils$$F();
            });
            function lib$rsvp$events$$indexOf(callbacks, callback) {
              for (var i=0, l=callbacks.length; i<l; i++) {
                if (callbacks[i] === callback) { return i; }
              }

              return -1;
            }

            function lib$rsvp$events$$callbacksFor(object) {
              var callbacks = object._promiseCallbacks;

              if (!callbacks) {
                callbacks = object._promiseCallbacks = {};
              }

              return callbacks;
            }

            var lib$rsvp$events$$default = {

              /**
                `RSVP.EventTarget.mixin` extends an object with EventTarget methods. For
                Example:

                ```javascript
                var object = {};

                RSVP.EventTarget.mixin(object);

                object.on('finished', function(event) {
                  // handle event
                });

                object.trigger('finished', { detail: value });
                ```

                `EventTarget.mixin` also works with prototypes:

                ```javascript
                var Person = function() {};
                RSVP.EventTarget.mixin(Person.prototype);

                var yehuda = new Person();
                var tom = new Person();

                yehuda.on('poke', function(event) {
                  console.log('Yehuda says OW');
                });

                tom.on('poke', function(event) {
                  console.log('Tom says OW');
                });

                yehuda.trigger('poke');
                tom.trigger('poke');
                ```

                @method mixin
                @for RSVP.EventTarget
                @private
                @param {Object} object object to extend with EventTarget methods
              */
              'mixin': function(object) {
                object['on']      = this['on'];
                object['off']     = this['off'];
                object['trigger'] = this['trigger'];
                object._promiseCallbacks = undefined;
                return object;
              },

              /**
                Registers a callback to be executed when `eventName` is triggered

                ```javascript
                object.on('event', function(eventInfo){
                  // handle the event
                });

                object.trigger('event');
                ```

                @method on
                @for RSVP.EventTarget
                @private
                @param {String} eventName name of the event to listen for
                @param {Function} callback function to be called when the event is triggered.
              */
              'on': function(eventName, callback) {
                var allCallbacks = lib$rsvp$events$$callbacksFor(this), callbacks;

                callbacks = allCallbacks[eventName];

                if (!callbacks) {
                  callbacks = allCallbacks[eventName] = [];
                }

                if (lib$rsvp$events$$indexOf(callbacks, callback) === -1) {
                  callbacks.push(callback);
                }
              },

              /**
                You can use `off` to stop firing a particular callback for an event:

                ```javascript
                function doStuff() { // do stuff! }
                object.on('stuff', doStuff);

                object.trigger('stuff'); // doStuff will be called

                // Unregister ONLY the doStuff callback
                object.off('stuff', doStuff);
                object.trigger('stuff'); // doStuff will NOT be called
                ```

                If you don't pass a `callback` argument to `off`, ALL callbacks for the
                event will not be executed when the event fires. For example:

                ```javascript
                var callback1 = function(){};
                var callback2 = function(){};

                object.on('stuff', callback1);
                object.on('stuff', callback2);

                object.trigger('stuff'); // callback1 and callback2 will be executed.

                object.off('stuff');
                object.trigger('stuff'); // callback1 and callback2 will not be executed!
                ```

                @method off
                @for RSVP.EventTarget
                @private
                @param {String} eventName event to stop listening to
                @param {Function} callback optional argument. If given, only the function
                given will be removed from the event's callback queue. If no `callback`
                argument is given, all callbacks will be removed from the event's callback
                queue.
              */
              'off': function(eventName, callback) {
                var allCallbacks = lib$rsvp$events$$callbacksFor(this), callbacks, index;

                if (!callback) {
                  allCallbacks[eventName] = [];
                  return;
                }

                callbacks = allCallbacks[eventName];

                index = lib$rsvp$events$$indexOf(callbacks, callback);

                if (index !== -1) { callbacks.splice(index, 1); }
              },

              /**
                Use `trigger` to fire custom events. For example:

                ```javascript
                object.on('foo', function(){
                  console.log('foo event happened!');
                });
                object.trigger('foo');
                // 'foo event happened!' logged to the console
                ```

                You can also pass a value as a second argument to `trigger` that will be
                passed as an argument to all event listeners for the event:

                ```javascript
                object.on('foo', function(value){
                  console.log(value.name);
                });

                object.trigger('foo', { name: 'bar' });
                // 'bar' logged to the console
                ```

                @method trigger
                @for RSVP.EventTarget
                @private
                @param {String} eventName name of the event to be triggered
                @param {Any} options optional value to be passed to any event handlers for
                the given `eventName`
              */
              'trigger': function(eventName, options) {
                var allCallbacks = lib$rsvp$events$$callbacksFor(this), callbacks, callback;

                if (callbacks = allCallbacks[eventName]) {
                  // Don't cache the callbacks.length since it may grow
                  for (var i=0; i<callbacks.length; i++) {
                    callback = callbacks[i];

                    callback(options);
                  }
                }
              }
            };

            var lib$rsvp$config$$config = {
              instrument: false
            };

            lib$rsvp$events$$default['mixin'](lib$rsvp$config$$config);

            function lib$rsvp$config$$configure(name, value) {
              if (name === 'onerror') {
                // handle for legacy users that expect the actual
                // error to be passed to their function added via
                // `RSVP.configure('onerror', someFunctionHere);`
                lib$rsvp$config$$config['on']('error', value);
                return;
              }

              if (arguments.length === 2) {
                lib$rsvp$config$$config[name] = value;
              } else {
                return lib$rsvp$config$$config[name];
              }
            }

            var lib$rsvp$instrument$$queue = [];

            function lib$rsvp$instrument$$scheduleFlush() {
              setTimeout(function() {
                var entry;
                for (var i = 0; i < lib$rsvp$instrument$$queue.length; i++) {
                  entry = lib$rsvp$instrument$$queue[i];

                  var payload = entry.payload;

                  payload.guid = payload.key + payload.id;
                  payload.childGuid = payload.key + payload.childId;
                  if (payload.error) {
                    payload.stack = payload.error.stack;
                  }

                  lib$rsvp$config$$config['trigger'](entry.name, entry.payload);
                }
                lib$rsvp$instrument$$queue.length = 0;
              }, 50);
            }

            function lib$rsvp$instrument$$instrument(eventName, promise, child) {
              if (1 === lib$rsvp$instrument$$queue.push({
                  name: eventName,
                  payload: {
                    key: promise._guidKey,
                    id:  promise._id,
                    eventName: eventName,
                    detail: promise._result,
                    childId: child && child._id,
                    label: promise._label,
                    timeStamp: lib$rsvp$utils$$now(),
                    error: lib$rsvp$config$$config["instrument-with-stack"] ? new Error(promise._label) : null
                  }})) {
                    lib$rsvp$instrument$$scheduleFlush();
                  }
              }
            var lib$rsvp$instrument$$default = lib$rsvp$instrument$$instrument;

            function  lib$rsvp$$internal$$withOwnPromise() {
              return new TypeError('A promises callback cannot return that same promise.');
            }

            function lib$rsvp$$internal$$noop() {}

            var lib$rsvp$$internal$$PENDING   = void 0;
            var lib$rsvp$$internal$$FULFILLED = 1;
            var lib$rsvp$$internal$$REJECTED  = 2;

            var lib$rsvp$$internal$$GET_THEN_ERROR = new lib$rsvp$$internal$$ErrorObject();

            function lib$rsvp$$internal$$getThen(promise) {
              try {
                return promise.then;
              } catch(error) {
                lib$rsvp$$internal$$GET_THEN_ERROR.error = error;
                return lib$rsvp$$internal$$GET_THEN_ERROR;
              }
            }

            function lib$rsvp$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
              try {
                then.call(value, fulfillmentHandler, rejectionHandler);
              } catch(e) {
                return e;
              }
            }

            function lib$rsvp$$internal$$handleForeignThenable(promise, thenable, then) {
              lib$rsvp$config$$config.async(function(promise) {
                var sealed = false;
                var error = lib$rsvp$$internal$$tryThen(then, thenable, function(value) {
                  if (sealed) { return; }
                  sealed = true;
                  if (thenable !== value) {
                    lib$rsvp$$internal$$resolve(promise, value);
                  } else {
                    lib$rsvp$$internal$$fulfill(promise, value);
                  }
                }, function(reason) {
                  if (sealed) { return; }
                  sealed = true;

                  lib$rsvp$$internal$$reject(promise, reason);
                }, 'Settle: ' + (promise._label || ' unknown promise'));

                if (!sealed && error) {
                  sealed = true;
                  lib$rsvp$$internal$$reject(promise, error);
                }
              }, promise);
            }

            function lib$rsvp$$internal$$handleOwnThenable(promise, thenable) {
              if (thenable._state === lib$rsvp$$internal$$FULFILLED) {
                lib$rsvp$$internal$$fulfill(promise, thenable._result);
              } else if (thenable._state === lib$rsvp$$internal$$REJECTED) {
                thenable._onError = null;
                lib$rsvp$$internal$$reject(promise, thenable._result);
              } else {
                lib$rsvp$$internal$$subscribe(thenable, undefined, function(value) {
                  if (thenable !== value) {
                    lib$rsvp$$internal$$resolve(promise, value);
                  } else {
                    lib$rsvp$$internal$$fulfill(promise, value);
                  }
                }, function(reason) {
                  lib$rsvp$$internal$$reject(promise, reason);
                });
              }
            }

            function lib$rsvp$$internal$$handleMaybeThenable(promise, maybeThenable) {
              if (maybeThenable.constructor === promise.constructor) {
                lib$rsvp$$internal$$handleOwnThenable(promise, maybeThenable);
              } else {
                var then = lib$rsvp$$internal$$getThen(maybeThenable);

                if (then === lib$rsvp$$internal$$GET_THEN_ERROR) {
                  lib$rsvp$$internal$$reject(promise, lib$rsvp$$internal$$GET_THEN_ERROR.error);
                } else if (then === undefined) {
                  lib$rsvp$$internal$$fulfill(promise, maybeThenable);
                } else if (lib$rsvp$utils$$isFunction(then)) {
                  lib$rsvp$$internal$$handleForeignThenable(promise, maybeThenable, then);
                } else {
                  lib$rsvp$$internal$$fulfill(promise, maybeThenable);
                }
              }
            }

            function lib$rsvp$$internal$$resolve(promise, value) {
              if (promise === value) {
                lib$rsvp$$internal$$fulfill(promise, value);
              } else if (lib$rsvp$utils$$objectOrFunction(value)) {
                lib$rsvp$$internal$$handleMaybeThenable(promise, value);
              } else {
                lib$rsvp$$internal$$fulfill(promise, value);
              }
            }

            function lib$rsvp$$internal$$publishRejection(promise) {
              if (promise._onError) {
                promise._onError(promise._result);
              }

              lib$rsvp$$internal$$publish(promise);
            }

            function lib$rsvp$$internal$$fulfill(promise, value) {
              if (promise._state !== lib$rsvp$$internal$$PENDING) { return; }

              promise._result = value;
              promise._state = lib$rsvp$$internal$$FULFILLED;

              if (promise._subscribers.length === 0) {
                if (lib$rsvp$config$$config.instrument) {
                  lib$rsvp$instrument$$default('fulfilled', promise);
                }
              } else {
                lib$rsvp$config$$config.async(lib$rsvp$$internal$$publish, promise);
              }
            }

            function lib$rsvp$$internal$$reject(promise, reason) {
              if (promise._state !== lib$rsvp$$internal$$PENDING) { return; }
              promise._state = lib$rsvp$$internal$$REJECTED;
              promise._result = reason;
              lib$rsvp$config$$config.async(lib$rsvp$$internal$$publishRejection, promise);
            }

            function lib$rsvp$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
              var subscribers = parent._subscribers;
              var length = subscribers.length;

              parent._onError = null;

              subscribers[length] = child;
              subscribers[length + lib$rsvp$$internal$$FULFILLED] = onFulfillment;
              subscribers[length + lib$rsvp$$internal$$REJECTED]  = onRejection;

              if (length === 0 && parent._state) {
                lib$rsvp$config$$config.async(lib$rsvp$$internal$$publish, parent);
              }
            }

            function lib$rsvp$$internal$$publish(promise) {
              var subscribers = promise._subscribers;
              var settled = promise._state;

              if (lib$rsvp$config$$config.instrument) {
                lib$rsvp$instrument$$default(settled === lib$rsvp$$internal$$FULFILLED ? 'fulfilled' : 'rejected', promise);
              }

              if (subscribers.length === 0) { return; }

              var child, callback, detail = promise._result;

              for (var i = 0; i < subscribers.length; i += 3) {
                child = subscribers[i];
                callback = subscribers[i + settled];

                if (child) {
                  lib$rsvp$$internal$$invokeCallback(settled, child, callback, detail);
                } else {
                  callback(detail);
                }
              }

              promise._subscribers.length = 0;
            }

            function lib$rsvp$$internal$$ErrorObject() {
              this.error = null;
            }

            var lib$rsvp$$internal$$TRY_CATCH_ERROR = new lib$rsvp$$internal$$ErrorObject();

            function lib$rsvp$$internal$$tryCatch(callback, detail) {
              try {
                return callback(detail);
              } catch(e) {
                lib$rsvp$$internal$$TRY_CATCH_ERROR.error = e;
                return lib$rsvp$$internal$$TRY_CATCH_ERROR;
              }
            }

            function lib$rsvp$$internal$$invokeCallback(settled, promise, callback, detail) {
              var hasCallback = lib$rsvp$utils$$isFunction(callback),
                  value, error, succeeded, failed;

              if (hasCallback) {
                value = lib$rsvp$$internal$$tryCatch(callback, detail);

                if (value === lib$rsvp$$internal$$TRY_CATCH_ERROR) {
                  failed = true;
                  error = value.error;
                  value = null;
                } else {
                  succeeded = true;
                }

                if (promise === value) {
                  lib$rsvp$$internal$$reject(promise, lib$rsvp$$internal$$withOwnPromise());
                  return;
                }

              } else {
                value = detail;
                succeeded = true;
              }

              if (promise._state !== lib$rsvp$$internal$$PENDING) {
                // noop
              } else if (hasCallback && succeeded) {
                lib$rsvp$$internal$$resolve(promise, value);
              } else if (failed) {
                lib$rsvp$$internal$$reject(promise, error);
              } else if (settled === lib$rsvp$$internal$$FULFILLED) {
                lib$rsvp$$internal$$fulfill(promise, value);
              } else if (settled === lib$rsvp$$internal$$REJECTED) {
                lib$rsvp$$internal$$reject(promise, value);
              }
            }

            function lib$rsvp$$internal$$initializePromise(promise, resolver) {
              var resolved = false;
              try {
                resolver(function resolvePromise(value){
                  if (resolved) { return; }
                  resolved = true;
                  lib$rsvp$$internal$$resolve(promise, value);
                }, function rejectPromise(reason) {
                  if (resolved) { return; }
                  resolved = true;
                  lib$rsvp$$internal$$reject(promise, reason);
                });
              } catch(e) {
                lib$rsvp$$internal$$reject(promise, e);
              }
            }

            function lib$rsvp$enumerator$$makeSettledResult(state, position, value) {
              if (state === lib$rsvp$$internal$$FULFILLED) {
                return {
                  state: 'fulfilled',
                  value: value
                };
              } else {
                return {
                  state: 'rejected',
                  reason: value
                };
              }
            }

            function lib$rsvp$enumerator$$Enumerator(Constructor, input, abortOnReject, label) {
              this._instanceConstructor = Constructor;
              this.promise = new Constructor(lib$rsvp$$internal$$noop, label);
              this._abortOnReject = abortOnReject;

              if (this._validateInput(input)) {
                this._input     = input;
                this.length     = input.length;
                this._remaining = input.length;

                this._init();

                if (this.length === 0) {
                  lib$rsvp$$internal$$fulfill(this.promise, this._result);
                } else {
                  this.length = this.length || 0;
                  this._enumerate();
                  if (this._remaining === 0) {
                    lib$rsvp$$internal$$fulfill(this.promise, this._result);
                  }
                }
              } else {
                lib$rsvp$$internal$$reject(this.promise, this._validationError());
              }
            }

            var lib$rsvp$enumerator$$default = lib$rsvp$enumerator$$Enumerator;

            lib$rsvp$enumerator$$Enumerator.prototype._validateInput = function(input) {
              return lib$rsvp$utils$$isArray(input);
            };

            lib$rsvp$enumerator$$Enumerator.prototype._validationError = function() {
              return new Error('Array Methods must be provided an Array');
            };

            lib$rsvp$enumerator$$Enumerator.prototype._init = function() {
              this._result = new Array(this.length);
            };

            lib$rsvp$enumerator$$Enumerator.prototype._enumerate = function() {
              var length  = this.length;
              var promise = this.promise;
              var input   = this._input;

              for (var i = 0; promise._state === lib$rsvp$$internal$$PENDING && i < length; i++) {
                this._eachEntry(input[i], i);
              }
            };

            lib$rsvp$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
              var c = this._instanceConstructor;
              if (lib$rsvp$utils$$isMaybeThenable(entry)) {
                if (entry.constructor === c && entry._state !== lib$rsvp$$internal$$PENDING) {
                  entry._onError = null;
                  this._settledAt(entry._state, i, entry._result);
                } else {
                  this._willSettleAt(c.resolve(entry), i);
                }
              } else {
                this._remaining--;
                this._result[i] = this._makeResult(lib$rsvp$$internal$$FULFILLED, i, entry);
              }
            };

            lib$rsvp$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
              var promise = this.promise;

              if (promise._state === lib$rsvp$$internal$$PENDING) {
                this._remaining--;

                if (this._abortOnReject && state === lib$rsvp$$internal$$REJECTED) {
                  lib$rsvp$$internal$$reject(promise, value);
                } else {
                  this._result[i] = this._makeResult(state, i, value);
                }
              }

              if (this._remaining === 0) {
                lib$rsvp$$internal$$fulfill(promise, this._result);
              }
            };

            lib$rsvp$enumerator$$Enumerator.prototype._makeResult = function(state, i, value) {
              return value;
            };

            lib$rsvp$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
              var enumerator = this;

              lib$rsvp$$internal$$subscribe(promise, undefined, function(value) {
                enumerator._settledAt(lib$rsvp$$internal$$FULFILLED, i, value);
              }, function(reason) {
                enumerator._settledAt(lib$rsvp$$internal$$REJECTED, i, reason);
              });
            };
            function lib$rsvp$promise$all$$all(entries, label) {
              return new lib$rsvp$enumerator$$default(this, entries, true /* abort on reject */, label).promise;
            }
            var lib$rsvp$promise$all$$default = lib$rsvp$promise$all$$all;
            function lib$rsvp$promise$race$$race(entries, label) {
              /*jshint validthis:true */
              var Constructor = this;

              var promise = new Constructor(lib$rsvp$$internal$$noop, label);

              if (!lib$rsvp$utils$$isArray(entries)) {
                lib$rsvp$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
                return promise;
              }

              var length = entries.length;

              function onFulfillment(value) {
                lib$rsvp$$internal$$resolve(promise, value);
              }

              function onRejection(reason) {
                lib$rsvp$$internal$$reject(promise, reason);
              }

              for (var i = 0; promise._state === lib$rsvp$$internal$$PENDING && i < length; i++) {
                lib$rsvp$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
              }

              return promise;
            }
            var lib$rsvp$promise$race$$default = lib$rsvp$promise$race$$race;
            function lib$rsvp$promise$resolve$$resolve(object, label) {
              /*jshint validthis:true */
              var Constructor = this;

              if (object && typeof object === 'object' && object.constructor === Constructor) {
                return object;
              }

              var promise = new Constructor(lib$rsvp$$internal$$noop, label);
              lib$rsvp$$internal$$resolve(promise, object);
              return promise;
            }
            var lib$rsvp$promise$resolve$$default = lib$rsvp$promise$resolve$$resolve;
            function lib$rsvp$promise$reject$$reject(reason, label) {
              /*jshint validthis:true */
              var Constructor = this;
              var promise = new Constructor(lib$rsvp$$internal$$noop, label);
              lib$rsvp$$internal$$reject(promise, reason);
              return promise;
            }
            var lib$rsvp$promise$reject$$default = lib$rsvp$promise$reject$$reject;

            var lib$rsvp$promise$$guidKey = 'rsvp_' + lib$rsvp$utils$$now() + '-';
            var lib$rsvp$promise$$counter = 0;

            function lib$rsvp$promise$$needsResolver() {
              throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
            }

            function lib$rsvp$promise$$needsNew() {
              throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
            }

            /**
              Promise objects represent the eventual result of an asynchronous operation. The
              primary way of interacting with a promise is through its `then` method, which
              registers callbacks to receive either a promiseâ€™s eventual value or the reason
              why the promise cannot be fulfilled.

              Terminology
              -----------

              - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
              - `thenable` is an object or function that defines a `then` method.
              - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
              - `exception` is a value that is thrown using the throw statement.
              - `reason` is a value that indicates why a promise was rejected.
              - `settled` the final resting state of a promise, fulfilled or rejected.

              A promise can be in one of three states: pending, fulfilled, or rejected.

              Promises that are fulfilled have a fulfillment value and are in the fulfilled
              state.  Promises that are rejected have a rejection reason and are in the
              rejected state.  A fulfillment value is never a thenable.

              Promises can also be said to *resolve* a value.  If this value is also a
              promise, then the original promise's settled state will match the value's
              settled state.  So a promise that *resolves* a promise that rejects will
              itself reject, and a promise that *resolves* a promise that fulfills will
              itself fulfill.


              Basic Usage:
              ------------

              ```js
              var promise = new Promise(function(resolve, reject) {
                // on success
                resolve(value);

                // on failure
                reject(reason);
              });

              promise.then(function(value) {
                // on fulfillment
              }, function(reason) {
                // on rejection
              });
              ```

              Advanced Usage:
              ---------------

              Promises shine when abstracting away asynchronous interactions such as
              `XMLHttpRequest`s.

              ```js
              function getJSON(url) {
                return new Promise(function(resolve, reject){
                  var xhr = new XMLHttpRequest();

                  xhr.open('GET', url);
                  xhr.onreadystatechange = handler;
                  xhr.responseType = 'json';
                  xhr.setRequestHeader('Accept', 'application/json');
                  xhr.send();

                  function handler() {
                    if (this.readyState === this.DONE) {
                      if (this.status === 200) {
                        resolve(this.response);
                      } else {
                        reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
                      }
                    }
                  };
                });
              }

              getJSON('/posts.json').then(function(json) {
                // on fulfillment
              }, function(reason) {
                // on rejection
              });
              ```

              Unlike callbacks, promises are great composable primitives.

              ```js
              Promise.all([
                getJSON('/posts'),
                getJSON('/comments')
              ]).then(function(values){
                values[0] // => postsJSON
                values[1] // => commentsJSON

                return values;
              });
              ```

              @class RSVP.Promise
              @param {function} resolver
              @param {String} label optional string for labeling the promise.
              Useful for tooling.
              @constructor
            */
            function lib$rsvp$promise$$Promise(resolver, label) {
              this._id = lib$rsvp$promise$$counter++;
              this._label = label;
              this._state = undefined;
              this._result = undefined;
              this._subscribers = [];

              if (lib$rsvp$config$$config.instrument) {
                lib$rsvp$instrument$$default('created', this);
              }

              if (lib$rsvp$$internal$$noop !== resolver) {
                if (!lib$rsvp$utils$$isFunction(resolver)) {
                  lib$rsvp$promise$$needsResolver();
                }

                if (!(this instanceof lib$rsvp$promise$$Promise)) {
                  lib$rsvp$promise$$needsNew();
                }

                lib$rsvp$$internal$$initializePromise(this, resolver);
              }
            }

            var lib$rsvp$promise$$default = lib$rsvp$promise$$Promise;

            // deprecated
            lib$rsvp$promise$$Promise.cast = lib$rsvp$promise$resolve$$default;
            lib$rsvp$promise$$Promise.all = lib$rsvp$promise$all$$default;
            lib$rsvp$promise$$Promise.race = lib$rsvp$promise$race$$default;
            lib$rsvp$promise$$Promise.resolve = lib$rsvp$promise$resolve$$default;
            lib$rsvp$promise$$Promise.reject = lib$rsvp$promise$reject$$default;

            lib$rsvp$promise$$Promise.prototype = {
              constructor: lib$rsvp$promise$$Promise,

              _guidKey: lib$rsvp$promise$$guidKey,

              _onError: function (reason) {
                lib$rsvp$config$$config.async(function(promise) {
                  setTimeout(function() {
                    if (promise._onError) {
                      lib$rsvp$config$$config['trigger']('error', reason);
                    }
                  }, 0);
                }, this);
              },

            /**
              The primary way of interacting with a promise is through its `then` method,
              which registers callbacks to receive either a promise's eventual value or the
              reason why the promise cannot be fulfilled.

              ```js
              findUser().then(function(user){
                // user is available
              }, function(reason){
                // user is unavailable, and you are given the reason why
              });
              ```

              Chaining
              --------

              The return value of `then` is itself a promise.  This second, 'downstream'
              promise is resolved with the return value of the first promise's fulfillment
              or rejection handler, or rejected if the handler throws an exception.

              ```js
              findUser().then(function (user) {
                return user.name;
              }, function (reason) {
                return 'default name';
              }).then(function (userName) {
                // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
                // will be `'default name'`
              });

              findUser().then(function (user) {
                throw new Error('Found user, but still unhappy');
              }, function (reason) {
                throw new Error('`findUser` rejected and we're unhappy');
              }).then(function (value) {
                // never reached
              }, function (reason) {
                // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
                // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
              });
              ```
              If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

              ```js
              findUser().then(function (user) {
                throw new PedagogicalException('Upstream error');
              }).then(function (value) {
                // never reached
              }).then(function (value) {
                // never reached
              }, function (reason) {
                // The `PedgagocialException` is propagated all the way down to here
              });
              ```

              Assimilation
              ------------

              Sometimes the value you want to propagate to a downstream promise can only be
              retrieved asynchronously. This can be achieved by returning a promise in the
              fulfillment or rejection handler. The downstream promise will then be pending
              until the returned promise is settled. This is called *assimilation*.

              ```js
              findUser().then(function (user) {
                return findCommentsByAuthor(user);
              }).then(function (comments) {
                // The user's comments are now available
              });
              ```

              If the assimliated promise rejects, then the downstream promise will also reject.

              ```js
              findUser().then(function (user) {
                return findCommentsByAuthor(user);
              }).then(function (comments) {
                // If `findCommentsByAuthor` fulfills, we'll have the value here
              }, function (reason) {
                // If `findCommentsByAuthor` rejects, we'll have the reason here
              });
              ```

              Simple Example
              --------------

              Synchronous Example

              ```javascript
              var result;

              try {
                result = findResult();
                // success
              } catch(reason) {
                // failure
              }
              ```

              Errback Example

              ```js
              findResult(function(result, err){
                if (err) {
                  // failure
                } else {
                  // success
                }
              });
              ```

              Promise Example;

              ```javascript
              findResult().then(function(result){
                // success
              }, function(reason){
                // failure
              });
              ```

              Advanced Example
              --------------

              Synchronous Example

              ```javascript
              var author, books;

              try {
                author = findAuthor();
                books  = findBooksByAuthor(author);
                // success
              } catch(reason) {
                // failure
              }
              ```

              Errback Example

              ```js

              function foundBooks(books) {

              }

              function failure(reason) {

              }

              findAuthor(function(author, err){
                if (err) {
                  failure(err);
                  // failure
                } else {
                  try {
                    findBoooksByAuthor(author, function(books, err) {
                      if (err) {
                        failure(err);
                      } else {
                        try {
                          foundBooks(books);
                        } catch(reason) {
                          failure(reason);
                        }
                      }
                    });
                  } catch(error) {
                    failure(err);
                  }
                  // success
                }
              });
              ```

              Promise Example;

              ```javascript
              findAuthor().
                then(findBooksByAuthor).
                then(function(books){
                  // found books
              }).catch(function(reason){
                // something went wrong
              });
              ```

              @method then
              @param {Function} onFulfilled
              @param {Function} onRejected
              @param {String} label optional string for labeling the promise.
              Useful for tooling.
              @return {Promise}
            */
              then: function(onFulfillment, onRejection, label) {
                var parent = this;
                var state = parent._state;

                if (state === lib$rsvp$$internal$$FULFILLED && !onFulfillment || state === lib$rsvp$$internal$$REJECTED && !onRejection) {
                  if (lib$rsvp$config$$config.instrument) {
                    lib$rsvp$instrument$$default('chained', this, this);
                  }
                  return this;
                }

                parent._onError = null;

                var child = new this.constructor(lib$rsvp$$internal$$noop, label);
                var result = parent._result;

                if (lib$rsvp$config$$config.instrument) {
                  lib$rsvp$instrument$$default('chained', parent, child);
                }

                if (state) {
                  var callback = arguments[state - 1];
                  lib$rsvp$config$$config.async(function(){
                    lib$rsvp$$internal$$invokeCallback(state, child, callback, result);
                  });
                } else {
                  lib$rsvp$$internal$$subscribe(parent, child, onFulfillment, onRejection);
                }

                return child;
              },

            /**
              `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
              as the catch block of a try/catch statement.

              ```js
              function findAuthor(){
                throw new Error('couldn't find that author');
              }

              // synchronous
              try {
                findAuthor();
              } catch(reason) {
                // something went wrong
              }

              // async with promises
              findAuthor().catch(function(reason){
                // something went wrong
              });
              ```

              @method catch
              @param {Function} onRejection
              @param {String} label optional string for labeling the promise.
              Useful for tooling.
              @return {Promise}
            */
              'catch': function(onRejection, label) {
                return this.then(null, onRejection, label);
              },

            /**
              `finally` will be invoked regardless of the promise's fate just as native
              try/catch/finally behaves

              Synchronous example:

              ```js
              findAuthor() {
                if (Math.random() > 0.5) {
                  throw new Error();
                }
                return new Author();
              }

              try {
                return findAuthor(); // succeed or fail
              } catch(error) {
                return findOtherAuther();
              } finally {
                // always runs
                // doesn't affect the return value
              }
              ```

              Asynchronous example:

              ```js
              findAuthor().catch(function(reason){
                return findOtherAuther();
              }).finally(function(){
                // author was either found, or not
              });
              ```

              @method finally
              @param {Function} callback
              @param {String} label optional string for labeling the promise.
              Useful for tooling.
              @return {Promise}
            */
              'finally': function(callback, label) {
                var constructor = this.constructor;

                return this.then(function(value) {
                  return constructor.resolve(callback()).then(function(){
                    return value;
                  });
                }, function(reason) {
                  return constructor.resolve(callback()).then(function(){
                    throw reason;
                  });
                }, label);
              }
            };

            function lib$rsvp$all$settled$$AllSettled(Constructor, entries, label) {
              this._superConstructor(Constructor, entries, false /* don't abort on reject */, label);
            }

            lib$rsvp$all$settled$$AllSettled.prototype = lib$rsvp$utils$$o_create(lib$rsvp$enumerator$$default.prototype);
            lib$rsvp$all$settled$$AllSettled.prototype._superConstructor = lib$rsvp$enumerator$$default;
            lib$rsvp$all$settled$$AllSettled.prototype._makeResult = lib$rsvp$enumerator$$makeSettledResult;
            lib$rsvp$all$settled$$AllSettled.prototype._validationError = function() {
              return new Error('allSettled must be called with an array');
            };

            function lib$rsvp$all$settled$$allSettled(entries, label) {
              return new lib$rsvp$all$settled$$AllSettled(lib$rsvp$promise$$default, entries, label).promise;
            }
            var lib$rsvp$all$settled$$default = lib$rsvp$all$settled$$allSettled;
            function lib$rsvp$all$$all(array, label) {
              return lib$rsvp$promise$$default.all(array, label);
            }
            var lib$rsvp$all$$default = lib$rsvp$all$$all;
            var lib$rsvp$asap$$len = 0;
            var lib$rsvp$asap$$toString = {}.toString;
            var lib$rsvp$asap$$vertxNext;
            function lib$rsvp$asap$$asap(callback, arg) {
              lib$rsvp$asap$$queue[lib$rsvp$asap$$len] = callback;
              lib$rsvp$asap$$queue[lib$rsvp$asap$$len + 1] = arg;
              lib$rsvp$asap$$len += 2;
              if (lib$rsvp$asap$$len === 2) {
                // If len is 1, that means that we need to schedule an async flush.
                // If additional callbacks are queued before the queue is flushed, they
                // will be processed by this flush that we are scheduling.
                lib$rsvp$asap$$scheduleFlush();
              }
            }

            var lib$rsvp$asap$$default = lib$rsvp$asap$$asap;

            var lib$rsvp$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
            var lib$rsvp$asap$$browserGlobal = lib$rsvp$asap$$browserWindow || {};
            var lib$rsvp$asap$$BrowserMutationObserver = lib$rsvp$asap$$browserGlobal.MutationObserver || lib$rsvp$asap$$browserGlobal.WebKitMutationObserver;
            var lib$rsvp$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

            // test for web worker but not in IE10
            var lib$rsvp$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
              typeof importScripts !== 'undefined' &&
              typeof MessageChannel !== 'undefined';

            // node
            function lib$rsvp$asap$$useNextTick() {
              var nextTick = process.nextTick;
              // node version 0.10.x displays a deprecation warning when nextTick is used recursively
              // setImmediate should be used instead instead
              var version = process.versions.node.match(/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)$/);
              if (Array.isArray(version) && version[1] === '0' && version[2] === '10') {
                nextTick = setImmediate;
              }
              return function() {
                nextTick(lib$rsvp$asap$$flush);
              };
            }

            // vertx
            function lib$rsvp$asap$$useVertxTimer() {
              return function() {
                lib$rsvp$asap$$vertxNext(lib$rsvp$asap$$flush);
              };
            }

            function lib$rsvp$asap$$useMutationObserver() {
              var iterations = 0;
              var observer = new lib$rsvp$asap$$BrowserMutationObserver(lib$rsvp$asap$$flush);
              var node = document.createTextNode('');
              observer.observe(node, { characterData: true });

              return function() {
                node.data = (iterations = ++iterations % 2);
              };
            }

            // web worker
            function lib$rsvp$asap$$useMessageChannel() {
              var channel = new MessageChannel();
              channel.port1.onmessage = lib$rsvp$asap$$flush;
              return function () {
                channel.port2.postMessage(0);
              };
            }

            function lib$rsvp$asap$$useSetTimeout() {
              return function() {
                setTimeout(lib$rsvp$asap$$flush, 1);
              };
            }

            var lib$rsvp$asap$$queue = new Array(1000);
            function lib$rsvp$asap$$flush() {
              for (var i = 0; i < lib$rsvp$asap$$len; i+=2) {
                var callback = lib$rsvp$asap$$queue[i];
                var arg = lib$rsvp$asap$$queue[i+1];

                callback(arg);

                lib$rsvp$asap$$queue[i] = undefined;
                lib$rsvp$asap$$queue[i+1] = undefined;
              }

              lib$rsvp$asap$$len = 0;
            }

            function lib$rsvp$asap$$attemptVertex() {
              try {
                var r = require;
                var vertx = r('vertx');
                lib$rsvp$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
                return lib$rsvp$asap$$useVertxTimer();
              } catch(e) {
                return lib$rsvp$asap$$useSetTimeout();
              }
            }

            var lib$rsvp$asap$$scheduleFlush;
            // Decide what async method to use to triggering processing of queued callbacks:
            if (lib$rsvp$asap$$isNode) {
              lib$rsvp$asap$$scheduleFlush = lib$rsvp$asap$$useNextTick();
            } else if (lib$rsvp$asap$$BrowserMutationObserver) {
              lib$rsvp$asap$$scheduleFlush = lib$rsvp$asap$$useMutationObserver();
            } else if (lib$rsvp$asap$$isWorker) {
              lib$rsvp$asap$$scheduleFlush = lib$rsvp$asap$$useMessageChannel();
            } else if (lib$rsvp$asap$$browserWindow === undefined && typeof require === 'function') {
              lib$rsvp$asap$$scheduleFlush = lib$rsvp$asap$$attemptVertex();
            } else {
              lib$rsvp$asap$$scheduleFlush = lib$rsvp$asap$$useSetTimeout();
            }
            function lib$rsvp$defer$$defer(label) {
              var deferred = { };

              deferred['promise'] = new lib$rsvp$promise$$default(function(resolve, reject) {
                deferred['resolve'] = resolve;
                deferred['reject'] = reject;
              }, label);

              return deferred;
            }
            var lib$rsvp$defer$$default = lib$rsvp$defer$$defer;
            function lib$rsvp$filter$$filter(promises, filterFn, label) {
              return lib$rsvp$promise$$default.all(promises, label).then(function(values) {
                if (!lib$rsvp$utils$$isFunction(filterFn)) {
                  throw new TypeError("You must pass a function as filter's second argument.");
                }

                var length = values.length;
                var filtered = new Array(length);

                for (var i = 0; i < length; i++) {
                  filtered[i] = filterFn(values[i]);
                }

                return lib$rsvp$promise$$default.all(filtered, label).then(function(filtered) {
                  var results = new Array(length);
                  var newLength = 0;

                  for (var i = 0; i < length; i++) {
                    if (filtered[i]) {
                      results[newLength] = values[i];
                      newLength++;
                    }
                  }

                  results.length = newLength;

                  return results;
                });
              });
            }
            var lib$rsvp$filter$$default = lib$rsvp$filter$$filter;

            function lib$rsvp$promise$hash$$PromiseHash(Constructor, object, label) {
              this._superConstructor(Constructor, object, true, label);
            }

            var lib$rsvp$promise$hash$$default = lib$rsvp$promise$hash$$PromiseHash;

            lib$rsvp$promise$hash$$PromiseHash.prototype = lib$rsvp$utils$$o_create(lib$rsvp$enumerator$$default.prototype);
            lib$rsvp$promise$hash$$PromiseHash.prototype._superConstructor = lib$rsvp$enumerator$$default;
            lib$rsvp$promise$hash$$PromiseHash.prototype._init = function() {
              this._result = {};
            };

            lib$rsvp$promise$hash$$PromiseHash.prototype._validateInput = function(input) {
              return input && typeof input === 'object';
            };

            lib$rsvp$promise$hash$$PromiseHash.prototype._validationError = function() {
              return new Error('Promise.hash must be called with an object');
            };

            lib$rsvp$promise$hash$$PromiseHash.prototype._enumerate = function() {
              var promise = this.promise;
              var input   = this._input;
              var results = [];

              for (var key in input) {
                if (promise._state === lib$rsvp$$internal$$PENDING && input.hasOwnProperty(key)) {
                  results.push({
                    position: key,
                    entry: input[key]
                  });
                }
              }

              var length = results.length;
              this._remaining = length;
              var result;

              for (var i = 0; promise._state === lib$rsvp$$internal$$PENDING && i < length; i++) {
                result = results[i];
                this._eachEntry(result.entry, result.position);
              }
            };

            function lib$rsvp$hash$settled$$HashSettled(Constructor, object, label) {
              this._superConstructor(Constructor, object, false, label);
            }

            lib$rsvp$hash$settled$$HashSettled.prototype = lib$rsvp$utils$$o_create(lib$rsvp$promise$hash$$default.prototype);
            lib$rsvp$hash$settled$$HashSettled.prototype._superConstructor = lib$rsvp$enumerator$$default;
            lib$rsvp$hash$settled$$HashSettled.prototype._makeResult = lib$rsvp$enumerator$$makeSettledResult;

            lib$rsvp$hash$settled$$HashSettled.prototype._validationError = function() {
              return new Error('hashSettled must be called with an object');
            };

            function lib$rsvp$hash$settled$$hashSettled(object, label) {
              return new lib$rsvp$hash$settled$$HashSettled(lib$rsvp$promise$$default, object, label).promise;
            }
            var lib$rsvp$hash$settled$$default = lib$rsvp$hash$settled$$hashSettled;
            function lib$rsvp$hash$$hash(object, label) {
              return new lib$rsvp$promise$hash$$default(lib$rsvp$promise$$default, object, label).promise;
            }
            var lib$rsvp$hash$$default = lib$rsvp$hash$$hash;
            function lib$rsvp$map$$map(promises, mapFn, label) {
              return lib$rsvp$promise$$default.all(promises, label).then(function(values) {
                if (!lib$rsvp$utils$$isFunction(mapFn)) {
                  throw new TypeError("You must pass a function as map's second argument.");
                }

                var length = values.length;
                var results = new Array(length);

                for (var i = 0; i < length; i++) {
                  results[i] = mapFn(values[i]);
                }

                return lib$rsvp$promise$$default.all(results, label);
              });
            }
            var lib$rsvp$map$$default = lib$rsvp$map$$map;

            function lib$rsvp$node$$Result() {
              this.value = undefined;
            }

            var lib$rsvp$node$$ERROR = new lib$rsvp$node$$Result();
            var lib$rsvp$node$$GET_THEN_ERROR = new lib$rsvp$node$$Result();

            function lib$rsvp$node$$getThen(obj) {
              try {
               return obj.then;
              } catch(error) {
                lib$rsvp$node$$ERROR.value= error;
                return lib$rsvp$node$$ERROR;
              }
            }


            function lib$rsvp$node$$tryApply(f, s, a) {
              try {
                f.apply(s, a);
              } catch(error) {
                lib$rsvp$node$$ERROR.value = error;
                return lib$rsvp$node$$ERROR;
              }
            }

            function lib$rsvp$node$$makeObject(_, argumentNames) {
              var obj = {};
              var name;
              var i;
              var length = _.length;
              var args = new Array(length);

              for (var x = 0; x < length; x++) {
                args[x] = _[x];
              }

              for (i = 0; i < argumentNames.length; i++) {
                name = argumentNames[i];
                obj[name] = args[i + 1];
              }

              return obj;
            }

            function lib$rsvp$node$$arrayResult(_) {
              var length = _.length;
              var args = new Array(length - 1);

              for (var i = 1; i < length; i++) {
                args[i - 1] = _[i];
              }

              return args;
            }

            function lib$rsvp$node$$wrapThenable(then, promise) {
              return {
                then: function(onFulFillment, onRejection) {
                  return then.call(promise, onFulFillment, onRejection);
                }
              };
            }

            function lib$rsvp$node$$denodeify(nodeFunc, options) {
              var fn = function() {
                var self = this;
                var l = arguments.length;
                var args = new Array(l + 1);
                var arg;
                var promiseInput = false;

                for (var i = 0; i < l; ++i) {
                  arg = arguments[i];

                  if (!promiseInput) {
                    // TODO: clean this up
                    promiseInput = lib$rsvp$node$$needsPromiseInput(arg);
                    if (promiseInput === lib$rsvp$node$$GET_THEN_ERROR) {
                      var p = new lib$rsvp$promise$$default(lib$rsvp$$internal$$noop);
                      lib$rsvp$$internal$$reject(p, lib$rsvp$node$$GET_THEN_ERROR.value);
                      return p;
                    } else if (promiseInput && promiseInput !== true) {
                      arg = lib$rsvp$node$$wrapThenable(promiseInput, arg);
                    }
                  }
                  args[i] = arg;
                }

                var promise = new lib$rsvp$promise$$default(lib$rsvp$$internal$$noop);

                args[l] = function(err, val) {
                  if (err)
                    lib$rsvp$$internal$$reject(promise, err);
                  else if (options === undefined)
                    lib$rsvp$$internal$$resolve(promise, val);
                  else if (options === true)
                    lib$rsvp$$internal$$resolve(promise, lib$rsvp$node$$arrayResult(arguments));
                  else if (lib$rsvp$utils$$isArray(options))
                    lib$rsvp$$internal$$resolve(promise, lib$rsvp$node$$makeObject(arguments, options));
                  else
                    lib$rsvp$$internal$$resolve(promise, val);
                };

                if (promiseInput) {
                  return lib$rsvp$node$$handlePromiseInput(promise, args, nodeFunc, self);
                } else {
                  return lib$rsvp$node$$handleValueInput(promise, args, nodeFunc, self);
                }
              };

              fn.__proto__ = nodeFunc;

              return fn;
            }

            var lib$rsvp$node$$default = lib$rsvp$node$$denodeify;

            function lib$rsvp$node$$handleValueInput(promise, args, nodeFunc, self) {
              var result = lib$rsvp$node$$tryApply(nodeFunc, self, args);
              if (result === lib$rsvp$node$$ERROR) {
                lib$rsvp$$internal$$reject(promise, result.value);
              }
              return promise;
            }

            function lib$rsvp$node$$handlePromiseInput(promise, args, nodeFunc, self){
              return lib$rsvp$promise$$default.all(args).then(function(args){
                var result = lib$rsvp$node$$tryApply(nodeFunc, self, args);
                if (result === lib$rsvp$node$$ERROR) {
                  lib$rsvp$$internal$$reject(promise, result.value);
                }
                return promise;
              });
            }

            function lib$rsvp$node$$needsPromiseInput(arg) {
              if (arg && typeof arg === 'object') {
                if (arg.constructor === lib$rsvp$promise$$default) {
                  return true;
                } else {
                  return lib$rsvp$node$$getThen(arg);
                }
              } else {
                return false;
              }
            }
            function lib$rsvp$race$$race(array, label) {
              return lib$rsvp$promise$$default.race(array, label);
            }
            var lib$rsvp$race$$default = lib$rsvp$race$$race;
            function lib$rsvp$reject$$reject(reason, label) {
              return lib$rsvp$promise$$default.reject(reason, label);
            }
            var lib$rsvp$reject$$default = lib$rsvp$reject$$reject;
            function lib$rsvp$resolve$$resolve(value, label) {
              return lib$rsvp$promise$$default.resolve(value, label);
            }
            var lib$rsvp$resolve$$default = lib$rsvp$resolve$$resolve;
            function lib$rsvp$rethrow$$rethrow(reason) {
              setTimeout(function() {
                throw reason;
              });
              throw reason;
            }
            var lib$rsvp$rethrow$$default = lib$rsvp$rethrow$$rethrow;

            // default async is asap;
            lib$rsvp$config$$config.async = lib$rsvp$asap$$default;
            var lib$rsvp$$cast = lib$rsvp$resolve$$default;
            function lib$rsvp$$async(callback, arg) {
              lib$rsvp$config$$config.async(callback, arg);
            }

            function lib$rsvp$$on() {
              lib$rsvp$config$$config['on'].apply(lib$rsvp$config$$config, arguments);
            }

            function lib$rsvp$$off() {
              lib$rsvp$config$$config['off'].apply(lib$rsvp$config$$config, arguments);
            }

            // Set up instrumentation through `window.__PROMISE_INTRUMENTATION__`
            if (typeof window !== 'undefined' && typeof window['__PROMISE_INSTRUMENTATION__'] === 'object') {
              var lib$rsvp$$callbacks = window['__PROMISE_INSTRUMENTATION__'];
              lib$rsvp$config$$configure('instrument', true);
              for (var lib$rsvp$$eventName in lib$rsvp$$callbacks) {
                if (lib$rsvp$$callbacks.hasOwnProperty(lib$rsvp$$eventName)) {
                  lib$rsvp$$on(lib$rsvp$$eventName, lib$rsvp$$callbacks[lib$rsvp$$eventName]);
                }
              }
            }

            var lib$rsvp$umd$$RSVP = {
              'race': lib$rsvp$race$$default,
              'Promise': lib$rsvp$promise$$default,
              'allSettled': lib$rsvp$all$settled$$default,
              'hash': lib$rsvp$hash$$default,
              'hashSettled': lib$rsvp$hash$settled$$default,
              'denodeify': lib$rsvp$node$$default,
              'on': lib$rsvp$$on,
              'off': lib$rsvp$$off,
              'map': lib$rsvp$map$$default,
              'filter': lib$rsvp$filter$$default,
              'resolve': lib$rsvp$resolve$$default,
              'reject': lib$rsvp$reject$$default,
              'all': lib$rsvp$all$$default,
              'rethrow': lib$rsvp$rethrow$$default,
              'defer': lib$rsvp$defer$$default,
              'EventTarget': lib$rsvp$events$$default,
              'configure': lib$rsvp$config$$configure,
              'async': lib$rsvp$$async
            };

            provide(lib$rsvp$umd$$RSVP);



    });
ym.modules.define(
    'todoAPI',
    ['jquery', 'commonData'],
    function(provide, $, commonData) {

        provide({

            getTodos: function() {
                return $.get(commonData.apiUrl);
            },

            addTodo: function(todo) {
                return $.post(commonData.apiUrl, todo);
            },

            updateTodos: function(todos) {
                return $.ajax({
                  type: 'POST',
                  contentType : 'application/json',
                  url: commonData.apiUrl + '/bulk',
                  data: JSON.stringify(todos),
                  dataType: 'json'
                });
            },

            updateTodo: function(todo) {
                return $.ajax({
                    url: commonData.apiUrl + '/' + todo._id,
                    type: 'PUT',
                    data: todo
                });
            },

            deleteTodo: function(id) {
                return $.ajax({
                    url: commonData.apiUrl + '/' + id,
                    type: 'DELETE',
                    data: {
                        id: id,
                        author: commonData.login
                    }
                });
            }
        });
    });
})(this);