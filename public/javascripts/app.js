modules.require(
    ['jquery', 'riot', 'todoApi'],
    function($, riot, todoApi) {

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
modules.define(
    'basket',
    function(provide) {

        /*!
        * basket.js
        * v0.5.1 - 2014-08-16
        * http://addyosmani.github.com/basket.js
        * (c) Addy Osmani;  License
        * Created by: Addy Osmani, Sindre Sorhus, Andrée Hansson, Mat Scales
        * Contributors: Ironsjp, Mathias Bynens, Rick Waldron, Felipe Morais
        * Uses rsvp.js, https://github.com/tildeio/rsvp.js
        */(function( window, document ) {
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

            var basket = {
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

        })( window, document );

        provide(basket);
    });
modules.define(
    'commonData',
    ['jquery'],
    function(provide, $) {

        provide({
            login: $.cookie('username') || undefined,
            apiUrl: '/todo'
        });

    });
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
modules.require(
  ['jquery', 'todoApi', 'commonData', 'riot'],
  function($, todoApi, commonData, riot) {
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
    
            TodoAPI
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
    
                todoApi
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
    
                todoApi
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
    
                todoApi
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
    
                todoApi
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
modules.define(
    'riot',
    function(provide) {

        /* Riot 2.0.1, @license MIT, (c) 2015 Muut Inc. + contributors */
        var riot={version:"v2.0.1"};"use strict";riot.observable=function(e){var t={};e.on=function(n,r){if(typeof r=="function"){n.replace(/\S+/g,function(e,n){(t[e]=t[e]||[]).push(r);r.typed=n>0})}return e};e.off=function(n,r){if(n=="*")t={};else if(r){var i=t[n];for(var o=0,u;u=i&&i[o];++o){if(u==r){i.splice(o,1);o--}}}else{n.replace(/\S+/g,function(e){t[e]=[]})}return e};e.one=function(t,n){if(n)n.one=1;return e.on(t,n)};e.trigger=function(n){var r=[].slice.call(arguments,1),i=t[n]||[];for(var o=0,u;u=i[o];++o){if(!u.busy){u.busy=1;u.apply(e,u.typed?[n].concat(r):r);if(u.one){i.splice(o,1);o--}u.busy=0}}return e};return e};(function(e,t){if(!this.top)return;var n=location,r=e.observable({}),i=u(),o=window;function u(){return n.hash.slice(1)}function a(e){if(e.type)e=u();if(e!=i){r.trigger.apply(null,["H"].concat(e.split("/")));i=e}}var f=e.route=function(e){if(e[0]){n.hash=e;a(e)}else{r.on("H",e)}};f.exec=function(e){e.apply(null,u().split("/"))};o.addEventListener?o.addEventListener(t,a,false):o.attachEvent("on"+t,a)})(riot,"hashchange");riot._tmpl=function(){var e={},t=/("|').+?[^\\]\1|\.\w*|\w*:|\b(?:this|true|false|null|new|typeof|Number|String|Object|Array|Math|Date)\b|([a-z_]\w*)/gi;return function(t,r){return t&&(e[t]=e[t]||n(t))(r)};function n(e,t){t=(e||"{}").replace(/\\{/g,"￰").replace(/\\}/g,"￱").split(/({[\s\S]*?})/);return new Function("d","return "+(!t[0]&&!t[2]?r(t[1]):"["+t.map(function(e,t){return t%2?r(e,1):'"'+e.replace(/\n/g,"\\n").replace(/"/g,'\\"')+'"'}).join(",")+'].join("")').replace(/\uFFF0/g,"{").replace(/\uFFF1/g,"}"))}function r(e,t){e=e.replace(/\n/g," ").replace(/^[{ ]+|[ }]+$|\/\*.+?\*\//g,"");return/^\s*[\w-"']+ *:/.test(e)?"["+e.replace(/\W*([\w-]+)\W*:([^,]+)/g,function(e,n,r){return r.replace(/\w[^,|& ]*/g,function(e){return i(e,t)})+'?"'+n+'":"",'})+'].join(" ")':i(e,t)}function i(e,n){return"(function(v){try{v="+(e.replace(t,function(e,t,n){return n?"d."+n:e})||"x")+"}finally{return "+(n?'!v&&v!==0?"":v':"v")+"}}).call(d)"}}();(function(e,t){var n=e._tmpl,r=[],i={};function o(e,t){for(var n=0;n<(e||[]).length;n++){if(t(e[n],n)===false)n--}}function u(e,t){t&&Object.keys(t).map(function(n){e[n]=t[n]});return e}function a(e,t){return e.filter(function(e){return t.indexOf(e)<0})}function f(e,t){e=t(e)===false?e.nextSibling:e.firstChild;while(e){f(e,t);e=e.nextSibling}}function l(e){var n=t.createElement("div");n.innerHTML=e;return n}function c(e,t){t.trigger("update");o(e,function(e){var r=e.tag,i=e.dom;function o(e){i.removeAttribute(e)}if(e.loop){o("each");return d(e,t)}if(r)return r.update?r.update():e.tag=s({tmpl:r[0],fn:r[1],root:i,parent:t});var u=e.attr,a=n(e.expr,t);if(a==null)a="";if(e.value===a)return;e.value=a;if(!u)return i.nodeValue=a;if(!a&&e.bool||/obj|func/.test(typeof a))o(u);if(typeof a=="function"){i[u]=function(e){e=e||window.event;e.which=e.which||e.charCode||e.keyCode;e.target=e.target||e.srcElement;e.currentTarget=i;e.item=t.__item||t;if(a.call(t,e)!==true){e.preventDefault&&e.preventDefault();e.returnValue=false}t.update()}}else if(/^(show|hide|if)$/.test(u)){o(u);if(u=="hide")a=!a;i.style.display=a?"":"none"}else{if(e.bool){if(!a)return;a=u}i.setAttribute(u,a)}});t.trigger("updated")}function p(e){var t={},n=[];f(e,function(e){var r=e.nodeType,a=e.nodeValue;function f(t,r){if(t?t.indexOf("{")>=0:r){var i={dom:e,expr:t};n.push(u(i,r||{}))}}if(r==3&&e.parentNode.tagName!="STYLE"){f(a)}else if(r==1){a=e.getAttribute("each");if(a){f(a,{loop:1});return false}var l=i[e.tagName.toLowerCase()];o(e.attributes,function(n){var r=n.name,i=n.value;if(/^(name|id)$/.test(r))t[i]=e;if(!l){var o=r.split("__")[1];f(i,{attr:o||r,bool:o});if(o){e.removeAttribute(r);return false}}});if(l)f(0,{tag:l})}});return{expr:n,elem:t}}function s(i){var a=i.opts||{},f=l(i.tmpl),s=i.root,d=i.parent,v=p(f),m={root:s,opts:a,parent:d,__item:i.item},g={};u(m,v.elem);o(s.attributes,function(e){g[e.name]=e.value});function h(){Object.keys(g).map(function(e){var t=a[e]=n(g[e],d||m);if(typeof t=="object")s.removeAttribute(e)})}h();if(!m.on){e.observable(m);delete m.off}if(i.fn)i.fn.call(m,a);m.update=function(e,n){if(d&&f&&!f.firstChild){s=d.root;f=null}if(n||t.body.contains(s)){u(m,e);u(m,m.__item);h();c(v.expr,m);!n&&m.__item&&d.update();return true}else{m.trigger("unmount")}};m.update(0,true);while(f.firstChild){if(i.before)s.insertBefore(f.firstChild,i.before);else s.appendChild(f.firstChild)}m.trigger("mount");r.push(m);return m}function d(e,t){if(e.done)return;e.done=true;var r=e.dom,i=r.previousSibling,o=r.parentNode,u=r.outerHTML,f=e.expr,l=f.split(/\s+in\s+/),c=[],p,o,d;if(l[1]){f="{ "+l[1];d=l[0].slice(1).trim().split(/,\s*/)}t.one("mount",function(){var e=r.parentNode;if(e){o=e;o.removeChild(r)}});function v(){return Array.prototype.indexOf.call(o.childNodes,i)+1}t.on("updated",function(){var e=n(f,t);is_array=Array.isArray(e);if(is_array)e=e.slice(0);else{if(!e)return;var r=JSON.stringify(e);if(r==p)return;p=r;e=Object.keys(e).map(function(t,n){var r={};r[d[0]]=t;r[d[1]]=e[t];return r})}a(c,e).map(function(e){var t=c.indexOf(e);o.removeChild(o.childNodes[v()+t]);c.splice(t,1)});a(e,c).map(function(n,r){var i=e.indexOf(n);if(d&&!p){var a={};a[d[0]]=n;a[d[1]]=r;n=a}var f=s({before:o.childNodes[v()+i],parent:t,tmpl:u,item:n,root:o});t.on("update",function(){f.update(0,true)})});c=e})}e.tag=function(e,t,n){n=n||noop,i[e]=[t,n]};e.mountTo=function(e,t,n){var r=i[t];return r&&s({tmpl:r[0],fn:r[1],root:e,opts:n})};e.mount=function(n,r){if(n=="*")n=Object.keys(i).join(", ");var u=[];o(t.querySelectorAll(n),function(t){if(t.riot)return;var n=t.tagName.toLowerCase(),i=e.mountTo(t,n,r);if(i){u.push(i);t.riot=1}});return u};e.update=function(){return r=r.filter(function(e){return!!e.update()})}})(riot,document);

        provide(riot);
    });


modules.define(
    'todoApi',
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
                    onDeclResolved = function(_, error) {
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
                    },
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

                    decls.push(decl);

                    startDeclResolving(decl, path, onDeclResolved);
                }
            },

            startDeclResolving = function(decl, path, cb) {
                if(decl.state === DECL_STATES.RESOLVED) {
                    cb(decl.exports);
                    return;
                }
                else if(decl.state === DECL_STATES.IN_RESOLVING) {
                    curOptions.trackCircularDependencies && isDependenceCircular(decl, path)?
                        cb(null, buildCircularDependenceError(decl, path)) :
                        decl.dependents.push(cb);
                    return;
                }

                decl.dependents.push(cb);

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

(function (modules){
var project = { DEBUG: false };
if (typeof modules == 'undefined' && typeof require == 'function') {
    var modules = require('ym');
}

// TODO refactoring

modules.define('system.mergeImports', [], function (provide) {
    function createNS (parentNs, path, data) {
        if (path) {
            var subObj = parentNs;
            path = path.split('.');
            var i = 0, l = path.length - 1, name;
            for (; i < l; i++) {
                if (path[i]) {//в начале может быть точка
                    subObj = subObj[name = path[i]] || (subObj[name] = {});
                }
            }
            subObj[path[l]] = data;
            return subObj[path[l]];
        } else {
            return data;
        }
    }


    function depsSort (a, b) {
        return a[2] - b[2];
    }

    function _isPackage (name) {
        return name.indexOf('package.') === 0;
    }

    function packageExtend (imports, ns) {
        for (var i in ns) {
            if (ns.hasOwnProperty(i)) {
                if (imports.hasOwnProperty(i)) {
                    //console.log('deep', i, typeof imports[i], typeof ns[i], ns[i] === imports[i]);
                    if (typeof imports[i] == 'object') {
                        packageExtend(imports[i], ns[i]);
                    }
                } else {
                    imports[i] = ns[i];
                }
            }
        }
    }

    function joinPackage (imports, deps, args) {
        var modules = [],
            checkList = {};
        for (var i = 0, l = deps.length; i < l; ++i) {
            var packageInfo = args[i].__package;
            if (!packageInfo) {
                createNS(imports, deps[i], args[i]);
                if (!checkList[deps[i]]) {
                    modules.push([deps[i], args[i]]);
                    checkList[deps[i]] = 1;
                }
            } else {
                for (var j = 0; j < packageInfo.length; ++j) {
                    if (!checkList[packageInfo[j][0]]) {
                        createNS(imports, packageInfo[j][0], packageInfo[j][1]);
                        modules.push([packageInfo[j][0], packageInfo[j][1]]);
                        checkList[packageInfo[j][0]] = 1;
                    }
                }
            }
        }
        imports.__package = modules;
        return imports;
    }

    function joinImports (thisName, imports, deps, args) {
        var ordered = [];
        var iAmPackage = _isPackage(thisName);
        if (iAmPackage) {
            return joinPackage(imports, deps, args);
        } else {
            for (var i = 0, l = deps.length; i < l; ++i) {
                ordered.push([deps[i], i, deps[i].length]);
            }
            ordered.sort(depsSort);
            for (var i = 0, l = ordered.length; i < l; ++i) {
                var order = ordered[i][1],
                    depName = deps[order];
                if (_isPackage(depName)) {
                    var packageInfo = args[order].__package;
                    for (var j = 0; j < packageInfo.length; ++j) {
                        createNS(imports, packageInfo[j][0], packageInfo[j][1]);
                    }
                    //console.error(thisName, 'loads', depName, '(its not good idea to load package from module)');
                    //depName = '';
                    //packageExtend(imports, args[order]);
                } else {
                    createNS(imports, depName, args[order]);
                }
            }
        }
        return imports;
    }

    provide({
        isPackage: _isPackage,
        joinImports: joinImports,
        createNS: createNS
    });
});
if (typeof modules == 'undefined' && typeof require == 'function') {
    var modules = require('ym');
}

modules.define('util.defineClass', ['util.extend'], function (provide, extend) {
    function augment (childClass, parentClass, override) {
        childClass.prototype = (Object.create || function (obj) {
            function F () {}

            F.prototype = obj;
            return new F();
        })(parentClass.prototype);

        childClass.prototype.constructor = childClass;
        childClass.superclass = parentClass.prototype;
        childClass.superclass.constructor = parentClass;

        if (override) {
            extend(childClass.prototype, override);
        }

        return childClass.prototype;
    }

    function createClass (childClass, parentClass, override) {
        if (typeof parentClass == 'function') {
            augment(childClass, parentClass, override);
        } else {
            override = parentClass;
            extend(childClass.prototype, override);
        }

        return childClass;
    }

    provide(createClass);
});
if (typeof modules == 'undefined' && typeof require == 'function') {
    var modules = require('ym');
}

modules.define("util.extend", [
    "util.objectKeys"
], function (provide, objectKeys) {
    /**
     * Функция, копирующая свойства из одного или нескольких
     * JavaScript-объектов в другой JavaScript-объект.
     * @param {Object} target Целевой JavaScript-объект. Будет модифицирован
     * в результате работы функции.
     * @param {Object} source JavaScript-объект - источник. Все его свойства
     * будут скопированы. Источников может быть несколько (функция может иметь
     * произвольное число параметров), данные копируются справа налево (последний
     * аргумент имеет наивысший приоритет при копировании).
     * @name util.extend
     * @function
     * @static
     *
     * @example
     * var options = ymaps.util.extend({
     *      prop1: 'a',
     *      prop2: 'b'
     * }, {
     *      prop2: 'c',
     *      prop3: 'd'
     * }, {
     *      prop3: 'e'
     * });
     * // Получим в итоге: {
     * //     prop1: 'a',
     * //     prop2: 'c',
     * //     prop3: 'e'
     * // }
     */

    function extend (target) {
        if (project.DEBUG) {
            if (!target) {
                throw new Error("util.extend: не передан параметр target");
            }
        }
        for (var i = 1, l = arguments.length; i < l; i++) {
            var arg = arguments[i];
            if (arg) {
                for (var prop in arg) {
                    if (arg.hasOwnProperty(prop)) {
                        target[prop] = arg[prop];
                    }
                }
            }
        }
        return target;
    }

    // этот вариант функции использует Object.keys для обхода обьектов
    function nativeExtend (target) {
        if (project.DEBUG) {
            if (!target) {
                throw new Error("util.extend: не передан параметр target");
            }
        }
        for (var i = 1, l = arguments.length; i < l; i++) {
            var arg = arguments[i];
            if (arg) {
                var keys = objectKeys(arg);
                for (var j = 0, k = keys.length; j < k; j++) {
                    target[keys[j]] = arg[keys[j]];
                }
            }
        }
        return target;
    }

    provide((typeof Object.keys == "function") ? nativeExtend : extend);
});
if (typeof modules == 'undefined' && typeof require == 'function') {
    var modules = require('ym');
}

modules.define("util.id", [], function (provide) {
    /**
     * @ignore
     * @name util.id
     */

    var id = new function () {
        /* Префикс, имеет три применения:
         * как префикс при генерации уникальных id, он призван давать уникальность при каждом запуске страницы
         * как имя свойства в котором хранятся id выданный объекту
         * как id для window
         */
        // http://jsperf.com/new-date-vs-date-now-vs-performance-now/6
        var prefix = ('id_' + (+(new Date())) + Math.round(Math.random() * 10000)).toString(),
            counterId = Math.round(Math.random() * 10000);

        function gen () {
            return (++counterId).toString();
        }

        /**
         * @ignore
         * Возвращает префикс, который используется как имя поля.
         * @return {String}
         */
        this.prefix = function () {
            return prefix;
        };

        /**
         * @ignore
         * Генерирует случайный ID. Возвращает результат в виде строки символов.
         * @returns {String} ID
         * @example
         * util.id.gen(); // -> '45654654654654'
         */
        this.gen = gen;

        /**
         * @ignore
         * Генерирует id и присваивает его свойству id переданного объекта. Если свойство id объекта существует,
         * то значение этого свойства не изменяется. Возвращает значение id в виде строки.
         * @param {Object} object Объект
         * @returns {String} ID
         */
        this.get = function (object) {
            return object === window ? prefix : object[prefix] || (object[prefix] = gen());
        };
    };

    provide(id);
});
if (typeof modules == 'undefined' && typeof require == 'function') {
    var modules = require('ym');
}

modules.define("util.objectKeys", [], function (provide) {
    var objectKeys = (typeof Object.keys == 'function') ? Object.keys : function (object) {
        var keys = [];
        for (var name in object) {
            if (object.hasOwnProperty(name)) {
                keys.push(name);
            }
        }
        return keys;
    };
    provide(function (object) {
        var typeofObject = typeof object,
            result;
        if (typeofObject == 'object' || typeofObject == 'function') {
            result = objectKeys(object);
        } else {
            throw new TypeError('Object.keys called on non-object');
        }
        return result;
    });
});
if (typeof modules == 'undefined' && typeof require == 'function') {
    var modules = require('ym');
}

modules.define('util.providePackage', ['system.mergeImports'], function (provide, mergeImports) {
    provide(function (srcPackage, packageArgs) {
        var packageProvide = packageArgs[0],
            packageModules = Array.prototype.slice.call(packageArgs, 1),
            ns = mergeImports.joinImports(srcPackage.name, {}, srcPackage.deps, packageModules);

        packageProvide(ns);
    });
});
if (typeof modules == 'undefined' && typeof require == 'function') {
    var modules = require('ym');
}

/**
 * @fileOverview
 * Парсер шаблонов.
 * Количество зависимостей было сведено к минимуму из-за того, что
 * тот класс используется в сборщике.
 */
modules.define("template.Parser", [
    "util.id"
], function (provide, utilId) {

    // TODO хорошо бы перенести в отдельный модуль. 
    // Главное не забыть в билдере подключить файл.
    var trimRegExp = /^\s+|\s+$/g,
        nativeTrim = typeof String.prototype.trim == 'function';

    function trim (str) {
        return nativeTrim ? str.trim() : str.replace(trimRegExp, '');
    }

    function escape (str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;')
            .replace(/"/g, '&quot;');
    }

    function getKeyValuePairs (str) {
        var pairs = [],
            parts = trim(str).replace(/\s*=\s*/g, '=').replace(/\s+/g, ' ').split(' ');

        for (var i = 0, l = parts.length; i < l; i++) {
            pairs.push(parts[i].split('=', 2));
        }

        return pairs;
    }

    function removeQuotes (string) {
        var firstSymbol = trim(string).charAt(0);
        if (firstSymbol == "'" || firstSymbol == '"') {
            return string.slice(1, string.length - 1);
        }
        return string;
    }

    function parseExpression (expression) {
        var parenthesesRegExp = /'|"/g,
            l = 0,
            tokens = [],
            match;

        while (match = parenthesesRegExp.exec(expression)) {
            var pos = match.index;

            if (pos >= l) {
                var endPos = expression.indexOf(match[0], pos + 1);
                if (l != pos) {
                    parseExpressionSubstitutes(tokens, expression.slice(l, pos));
                }
                tokens.push(expression.slice(pos, endPos + 1));
                l = endPos + 1;
            }
        }

        if (l < expression.length) {
            parseExpressionSubstitutes(tokens, expression.slice(l));
        }

        return tokens.join('');
    }

    var DataLogger = function (dataManager) {
        this._dataManager = dataManager;
        this._renderedValues = {};
        this._contexts = {};
    };

    DataLogger.prototype.get = function (key) {
        if (this._renderedValues.hasOwnProperty(key)) {
            return this._renderedValues[key].value;
        }

        var dotIndex = key.indexOf('.'),
            keyPart = (dotIndex > -1) ? trim(key.substring(0, dotIndex)) : trim(key);
        if (this._contexts.hasOwnProperty(keyPart)) {
            key = key.replace(keyPart, this._contexts[keyPart]);
        }

        var value = this._dataManager.get(key);
        this.set(key, value);
        return value;
    };

    DataLogger.prototype.setContext = function (key1, key2) {
        this._contexts[key1] = key2;
    };

    DataLogger.prototype.set = function (key, value) {
        // http://jsperf.com/split-vs-indexof
        if (key.indexOf('.') > -1) {
            var parts = key.split('.'),
                currentKey = "";
            // Записываем все промежуточные значения. 
            for (var i = 0, l = parts.length - 1; i < l; i++) {
                currentKey += ((i === 0) ? "" : ".") + parts[i];
                this._renderedValues[currentKey] = { value: this._dataManager.get(currentKey) };
            }
        }
        this._renderedValues[key] = { value: value };
    };

    DataLogger.prototype.getRenderedValues = function () {
        return this._renderedValues;
    };

    var stopWords = {
        'true': true,
        'false': true,
        'undefined': true,
        'null': true,
        'typeof': true
    };

    function parseExpressionSubstitutes (tokens, expression) {
        var variablesRegExp = /(^|[^\w\$])([A-Za-z_\$][\w\$\.]*)(?:[^\w\d_\$]|$)/g,
            l = 0,
            match;

        while (match = variablesRegExp.exec(expression)) {
            var pos = match.index + match[1].length,
                key = match[2],
                endPos = pos + key.length;

            if (pos > l) {
                tokens.push(expression.slice(l, pos));
            }

            if (stopWords[key]) {
                tokens.push(key);
            } else {
                tokens.push('data.get("' + key + '")');
            }

            l = endPos;
        }

        if (l < expression.length) {
            tokens.push(expression.slice(l));
        }
    }

    function evaluateExpression (expression, data) {
        var result;
        eval('result = ' + expression);
        return result;
    }

    // Токен контента
    var CONTENT = 0,
        startTokenRegExp = new RegExp([
            '\\$\\[\\[', '\\$\\[(?!\\])', '\\[if',
            '\\[else\\]', '\\[endif\\]', '\\{\\{', '\\{%'].join('|'), 'g');

    /**
     * @ignore
     * @class Парсер шаблонов.
     */
    var Parser = function () { };

    /**
     * @ignore
     * @class Парсер шаблонов.
     */

    Parser.prototype.scanners = {};
    Parser.prototype.builders = {};

    Parser.prototype.parse = function (text) {
        var tokens = [],
            pos = 0, startTokenPos, endTokenPos, contentPos,
            match;

        startTokenRegExp.lastIndex = 0;

        while (match = startTokenRegExp.exec(text)) {
            if (match.index >= pos) {
                startTokenPos = match.index;
                contentPos = startTokenPos + match[0].length;

                if (pos != startTokenPos) {
                    tokens.push(CONTENT, text.slice(pos, startTokenPos));
                }

                var scanner = this.scanners[match[0]];

                if (scanner.token) {
                    tokens.push(scanner.token, null);
                    pos = contentPos;
                } else {
                    endTokenPos = text.indexOf(scanner.stopToken, contentPos);
                    scanner.scan(tokens, text.slice(contentPos, endTokenPos));
                    pos = endTokenPos + scanner.stopToken.length;
                }
            }
        }

        if (pos < text.length) {
            tokens.push(CONTENT, text.slice(pos));
        }

        return tokens;
    };

    Parser.prototype.build = function (tree, data) {
        var result = {
            nodes: tree,
            left: 0,
            right: tree.length,
            empty: true,
            subnodes: [],
            sublayouts: [],
            strings: [],
            data: new DataLogger(data)
        };
        this._buildTree(result);
        result.renderedValues = result.data.getRenderedValues();
        return result;
    };

    Parser.prototype._buildTree = function (tree) {
        var nodes = tree.nodes,
            strings = tree.strings;
        while (tree.left < tree.right) {
            var node = nodes[tree.left];
            if (node == CONTENT) {
                strings.push(nodes[tree.left + 1]);
                tree.empty = false;
                tree.left += 2;
            } else {
                this.builders[node](tree, this);
            }
        }
    };

    // Токены старого синтаксиса
    var OLD_SUBSTITUTE = 1001,
        OLD_SUBLAYOUT = 1002,
        OLD_IF = 1003,
        OLD_ELSE = 1004,
        OLD_ENDIF = 1005;

    Parser.prototype.scanners['$[['] = {
        stopToken: ']]',
        scan: function (tokens, text) {
            var parts = text.match(/^(\S+)\s*(\S.*)?$/);
            tokens.push(OLD_SUBLAYOUT, [parts[1], parts[2] ? getKeyValuePairs(parts[2]) : []]);
        }
    };

    Parser.prototype.scanners['$['] = {
        stopToken: ']',
        scan: function (tokens, text) {
            var parts = text.split('|', 2);
            tokens.push(OLD_SUBSTITUTE, parts);
        }
    };

    Parser.prototype.scanners['[if'] = {
        stopToken: ']',
        scan: function (tokens, text) {
            var parts = text.match(/^(def)? (.+)$/),
                substitutes = parseExpression(parts[2]);

            tokens.push(OLD_IF, [parts[1], substitutes]);
        }
    };

    Parser.prototype.scanners['[else]'] = {
        token: OLD_ELSE
    };

    Parser.prototype.scanners['[endif]'] = {
        token: OLD_ENDIF
    };

    Parser.prototype.builders[OLD_SUBSTITUTE] = function (tree, parser) {
        var key = tree.nodes[tree.left + 1][0],
            value = tree.data.get(key);

        if (typeof value == 'undefined') {
            value = tree.nodes[tree.left + 1][1];
        }

        tree.strings.push(value);
        tree.left += 2;
        tree.empty = tree.empty && !value;
    };

    Parser.prototype.builders[OLD_SUBLAYOUT] = function (tree, parser) {
        var id = utilId.prefix() + utilId.gen(),
            key = tree.nodes[tree.left + 1][0];

        tree.strings.push('<ymaps id="' + id + '"></ymaps>');

        var sublayoutInfo = {
                id: id,
                key: key,
                value: tree.data.get(key) || key
            },
            monitorValues = [],
            splitDefault = [];

        var params = tree.nodes[tree.left + 1][1];

        for (var i = 0, l = params.length; i < l; i++) {
            var pair = params[i],
                k = pair[0],
                v = pair[1] || "true",
                end = v.length - 1,
                val;

            // если значение в кавычках, парсим как строку
            if (
                (v.charAt(0) == '"' && v.charAt(end) == '"') ||
                (v.charAt(0) == '\'' && v.charAt(end) == '\'')
                ) {
                val = v.substring(1, end);

                // если цифра или true|false - как есть
            } else if (!isNaN(Number(v))) {
                val = v;

            } else if (v == "true") {
                val = true;

            } else if (v == "false") {
                val = false;

                // иначе - ищем в данных
            } else {
                splitDefault = v.split('|');
                val = tree.data.get(splitDefault[0], splitDefault[1]);
                monitorValues.push(splitDefault[0]);
            }

            sublayoutInfo[k] = val;
        }

        sublayoutInfo.monitorValues = monitorValues;

        tree.sublayouts.push(sublayoutInfo);
        tree.left += 2;
    };

    Parser.prototype.builders[OLD_IF] = function (tree, parser) {
        var nodes = tree.nodes,
            left = tree.left,
            ifdef = nodes[left + 1][0],
            expression = nodes[left + 1][1],
            result = evaluateExpression(expression, tree.data),
            isTrue = ifdef ? typeof result != "undefined" : !!result,
            l,
            i = tree.left + 2,
            r = tree.right,
            counter = 1,
            elsePosition,
            endIfPosition;

        while (i < r) {
            if (nodes[i] == OLD_IF) {
                counter++;
            } else if (nodes[i] == OLD_ELSE) {
                if (counter == 1) {
                    elsePosition = i;
                }
            } else if (nodes[i] == OLD_ENDIF) {
                if (!--counter) {
                    endIfPosition = i;
                }
            }
            if (endIfPosition) {
                break;
            }
            i += 2;
        }

        if (isTrue) {
            l = tree.left + 2;
            r = elsePosition ? elsePosition : endIfPosition;
        } else {
            l = elsePosition ? elsePosition + 2 : endIfPosition;
            r = endIfPosition;
        }

        if (l != r) {
            var oldRight = tree.right,
                oldEmpty = tree.empty;

            tree.left = l;
            tree.right = r;

            parser._buildTree(tree);

            tree.empty = tree.empty && oldEmpty;
            tree.right = oldRight;
        }

        tree.left = endIfPosition + 2;
    };

    // Токены нового синтаксиса
    var SUBSTITUTE = 2001,
        INCLUDE = 2002,
        IF = 2003,
        ELSE = 2004,
        ENDIF = 2005,
        FOR = 2006,
        ENDFOR = 2007,
        ELSEIF = 2008;

    Parser.prototype.scanners['{{'] = {
        stopToken: '}}',
        scan: function (tokens, text) {
            var parts = trim(text).split('|'),
                filters = [];
            for (var i = 1, l = parts.length; i < l; i++) {
                var match = parts[i].split(':', 2),
                    filter = trim(match[0]),
                    filterValue = match[1];//null;

                if (match[1]) {
                    if (filter != 'default') {
                        filterValue = parseExpression(removeQuotes(match[1]));
                    } else {
                        filterValue = trim(match[1]);
                    }
                }
                filters.push([filter, filterValue]);
            }
            tokens.push(SUBSTITUTE, [parts[0], filters]);
        }
    };

    Parser.prototype.scanners['{%'] = {
        stopToken: '%}',
        scan: function (tokens, text) {
            var match = trim(text).match(/^([A-Za-z]+)(\s+\S.*)?$/),
                operator = match[1],
                expression = match[2] ? trim(match[2]) : null;

            switch (operator) {
                case 'if':
                    tokens.push(IF, parseExpression(expression));
                    break;
                case 'else':
                    tokens.push(ELSE, null);
                    break;
                case 'elseif':
                    tokens.push(ELSEIF, parseExpression(expression));
                    break;
                case 'endif':
                    tokens.push(ENDIF, null);
                    break;
                case 'include':
                    var conditions = getKeyValuePairs(expression);
                    tokens.push(INCLUDE, [removeQuotes(conditions[0][0]), conditions.slice(1)]);
                    break;
                case 'for':
                    tokens.push(FOR, expression);
                    break;
                case 'endfor':
                    tokens.push(ENDFOR, null);
                    break;
            }
        }
    };

    Parser.prototype.builders[SUBSTITUTE] = function (tree, parser) {
        // Для ключей вида object[0], object["test"][0] и т.д.
        var keyWithSquareBracketsRegExp  = /\[\s*([0-9]+|\'[^\']+\'|\"[^\"]+\")\s*\]/g,
            treeValue = tree.nodes[tree.left + 1],
            key = treeValue[0],
            value,
            filters = treeValue[1],
            needEscape = true,
            i,
            l;

        if (!keyWithSquareBracketsRegExp.test(key)) {
            value = tree.data.get(key);
        } else {
            var path = key.match(keyWithSquareBracketsRegExp);
            key = key.split(path[0])[0];

            for (i = 0, l = path.length; i < l; i++) {
                path[i] = trim(path[i].replace('[', '').replace(']', ''));
                path[i] = removeQuotes(path[i]);

            }
            value = tree.data.get(key + '.' + path.join('.'));
        }

        for (i = 0, l = filters.length; i < l; i++) {
            var filter = filters[i];
            switch (filter[0]) {
                case 'default':
                    if (typeof value == 'undefined') {
                        key = filter[1];
                        var word = removeQuotes(key);
                        if (key.length == word.length) {
                            if (!isNaN(word)) {
                                value = word;
                            } else {
                                value = tree.data.get(key);
                            }
                        } else {
                            value = word;
                        }
                    }
                    break;
                case 'raw':
                    needEscape = false;
                    break;
            }
        }

        if (needEscape && typeof value == 'string') {
            value = escape(value);
        }

        tree.strings.push(value);
        tree.left += 2;
        tree.empty = tree.empty && !value;
    };

    Parser.prototype.builders[INCLUDE] = Parser.prototype.builders[OLD_SUBLAYOUT];

    Parser.prototype.builders[FOR] = function (tree, parser) {
        var nodes = tree.nodes,
            i = tree.left + 2,
            left,
            right = tree.right,
            counter = 1,
            endForPosition;

        // Определяем область действия for.
        while (i < right) {
            if (nodes[i] == FOR) {
                counter++;
            } else if (nodes[i] == ENDFOR) {
                if (!--counter) {
                    endForPosition = i;
                }
            }
            if (endForPosition) {
                break;
            }
            i += 2;
        }

        left = tree.left + 2;
        right = endForPosition;

        if (left != right) {
            var expressionParts = nodes[tree.left + 1].split(/\sin\s/),
                beforeIn = trim(expressionParts[0]),
                afterIn = trim(expressionParts[1]),
                list = tree.data.get(afterIn),
                params = beforeIn.split(','),
                paramsLength = params.length;

            // Создаем временное дерево для обработки блока. 
            var originRight = tree.right,
                originEmpty = tree.empty,
                originLogger = tree.data,
                tmpDataLogger = new DataLogger(originLogger);

            tree.data = tmpDataLogger;

            for (var property in list) {
                tree.left = left;
                tree.right = right;

                if (list.hasOwnProperty(property)) {
                    if (paramsLength == 1) {
                        tmpDataLogger.setContext(beforeIn, afterIn + "." + property);
                    } else {
                        tmpDataLogger.set(trim(params[0]), property);
                        tmpDataLogger.setContext(trim(params[1]), afterIn + "." + property);
                    }
                    parser._buildTree(tree);
                }
            }

            // Восстанавливаем состоянение оригинального блока с учетом данных временного дерева.
            tree.empty = tree.empty && originEmpty;
            tree.right = originRight;
            tree.data = originLogger;
        }

        tree.left = endForPosition + 2;
    };

    Parser.prototype.builders[IF] =
    Parser.prototype.builders[ELSEIF] = function (tree, parser) {
        var nodes = tree.nodes,
            left = tree.left,
            expression = nodes[left + 1],
            result = evaluateExpression(expression, tree.data),
            isTrue = !!result,
            l,
            i = tree.left + 2,
            r = tree.right,
            depth = 1,
            elsePosition,
            elseIfPosition,
            endIfPosition,
            node;

        while (i < r) {
            node = nodes[i];
            if (node == IF) {
                depth++;
            } else if (node == ELSEIF) {
                if (depth == 1 && !elseIfPosition) {
                    elseIfPosition = i;
                }
            } else if (node == ELSE) {
                if (depth == 1) {
                    elsePosition = i;
                }
            } else if (node == ENDIF) {
                if (!--depth) {
                    endIfPosition = i;
                }
            }
            if (endIfPosition) {
                break;
            }
            i += 2;
        }

        if (isTrue) {
            l = tree.left + 2;
            r = elseIfPosition || elsePosition || endIfPosition;
        } else {
            if (elseIfPosition) {
                l = elseIfPosition;
                r = endIfPosition + 1;
            } else {
                l = elsePosition ? elsePosition + 2 : endIfPosition;
                r = endIfPosition;
            }
        }

        if (l != r) {
            var oldRight = tree.right,
                oldEmpty = tree.empty;

            tree.left = l;
            tree.right = r;

            parser._buildTree(tree);

            tree.empty = tree.empty && oldEmpty;
            tree.right = oldRight;
        }

        tree.left = endIfPosition + 2;
    };

    provide(Parser);
});
})(ym.modules);
