ym.modules.define(
    'riot',
    function(provide) {

        /* Riot 2.0.1, @license MIT, (c) 2015 Muut Inc. + contributors */
        var riot={version:"v2.0.1"};"use strict";riot.observable=function(e){var t={};e.on=function(n,r){if(typeof r=="function"){n.replace(/\S+/g,function(e,n){(t[e]=t[e]||[]).push(r);r.typed=n>0})}return e};e.off=function(n,r){if(n=="*")t={};else if(r){var i=t[n];for(var o=0,u;u=i&&i[o];++o){if(u==r){i.splice(o,1);o--}}}else{n.replace(/\S+/g,function(e){t[e]=[]})}return e};e.one=function(t,n){if(n)n.one=1;return e.on(t,n)};e.trigger=function(n){var r=[].slice.call(arguments,1),i=t[n]||[];for(var o=0,u;u=i[o];++o){if(!u.busy){u.busy=1;u.apply(e,u.typed?[n].concat(r):r);if(u.one){i.splice(o,1);o--}u.busy=0}}return e};return e};(function(e,t){if(!this.top)return;var n=location,r=e.observable({}),i=u(),o=window;function u(){return n.hash.slice(1)}function a(e){if(e.type)e=u();if(e!=i){r.trigger.apply(null,["H"].concat(e.split("/")));i=e}}var f=e.route=function(e){if(e[0]){n.hash=e;a(e)}else{r.on("H",e)}};f.exec=function(e){e.apply(null,u().split("/"))};o.addEventListener?o.addEventListener(t,a,false):o.attachEvent("on"+t,a)})(riot,"hashchange");riot._tmpl=function(){var e={},t=/("|').+?[^\\]\1|\.\w*|\w*:|\b(?:this|true|false|null|new|typeof|Number|String|Object|Array|Math|Date)\b|([a-z_]\w*)/gi;return function(t,r){return t&&(e[t]=e[t]||n(t))(r)};function n(e,t){t=(e||"{}").replace(/\\{/g,"￰").replace(/\\}/g,"￱").split(/({[\s\S]*?})/);return new Function("d","return "+(!t[0]&&!t[2]?r(t[1]):"["+t.map(function(e,t){return t%2?r(e,1):'"'+e.replace(/\n/g,"\\n").replace(/"/g,'\\"')+'"'}).join(",")+'].join("")').replace(/\uFFF0/g,"{").replace(/\uFFF1/g,"}"))}function r(e,t){e=e.replace(/\n/g," ").replace(/^[{ ]+|[ }]+$|\/\*.+?\*\//g,"");return/^\s*[\w-"']+ *:/.test(e)?"["+e.replace(/\W*([\w-]+)\W*:([^,]+)/g,function(e,n,r){return r.replace(/\w[^,|& ]*/g,function(e){return i(e,t)})+'?"'+n+'":"",'})+'].join(" ")':i(e,t)}function i(e,n){return"(function(v){try{v="+(e.replace(t,function(e,t,n){return n?"d."+n:e})||"x")+"}finally{return "+(n?'!v&&v!==0?"":v':"v")+"}}).call(d)"}}();(function(e,t){var n=e._tmpl,r=[],i={};function o(e,t){for(var n=0;n<(e||[]).length;n++){if(t(e[n],n)===false)n--}}function u(e,t){t&&Object.keys(t).map(function(n){e[n]=t[n]});return e}function a(e,t){return e.filter(function(e){return t.indexOf(e)<0})}function f(e,t){e=t(e)===false?e.nextSibling:e.firstChild;while(e){f(e,t);e=e.nextSibling}}function l(e){var n=t.createElement("div");n.innerHTML=e;return n}function c(e,t){t.trigger("update");o(e,function(e){var r=e.tag,i=e.dom;function o(e){i.removeAttribute(e)}if(e.loop){o("each");return d(e,t)}if(r)return r.update?r.update():e.tag=s({tmpl:r[0],fn:r[1],root:i,parent:t});var u=e.attr,a=n(e.expr,t);if(a==null)a="";if(e.value===a)return;e.value=a;if(!u)return i.nodeValue=a;if(!a&&e.bool||/obj|func/.test(typeof a))o(u);if(typeof a=="function"){i[u]=function(e){e=e||window.event;e.which=e.which||e.charCode||e.keyCode;e.target=e.target||e.srcElement;e.currentTarget=i;e.item=t.__item||t;if(a.call(t,e)!==true){e.preventDefault&&e.preventDefault();e.returnValue=false}t.update()}}else if(/^(show|hide|if)$/.test(u)){o(u);if(u=="hide")a=!a;i.style.display=a?"":"none"}else{if(e.bool){if(!a)return;a=u}i.setAttribute(u,a)}});t.trigger("updated")}function p(e){var t={},n=[];f(e,function(e){var r=e.nodeType,a=e.nodeValue;function f(t,r){if(t?t.indexOf("{")>=0:r){var i={dom:e,expr:t};n.push(u(i,r||{}))}}if(r==3&&e.parentNode.tagName!="STYLE"){f(a)}else if(r==1){a=e.getAttribute("each");if(a){f(a,{loop:1});return false}var l=i[e.tagName.toLowerCase()];o(e.attributes,function(n){var r=n.name,i=n.value;if(/^(name|id)$/.test(r))t[i]=e;if(!l){var o=r.split("__")[1];f(i,{attr:o||r,bool:o});if(o){e.removeAttribute(r);return false}}});if(l)f(0,{tag:l})}});return{expr:n,elem:t}}function s(i){var a=i.opts||{},f=l(i.tmpl),s=i.root,d=i.parent,v=p(f),m={root:s,opts:a,parent:d,__item:i.item},g={};u(m,v.elem);o(s.attributes,function(e){g[e.name]=e.value});function h(){Object.keys(g).map(function(e){var t=a[e]=n(g[e],d||m);if(typeof t=="object")s.removeAttribute(e)})}h();if(!m.on){e.observable(m);delete m.off}if(i.fn)i.fn.call(m,a);m.update=function(e,n){if(d&&f&&!f.firstChild){s=d.root;f=null}if(n||t.body.contains(s)){u(m,e);u(m,m.__item);h();c(v.expr,m);!n&&m.__item&&d.update();return true}else{m.trigger("unmount")}};m.update(0,true);while(f.firstChild){if(i.before)s.insertBefore(f.firstChild,i.before);else s.appendChild(f.firstChild)}m.trigger("mount");r.push(m);return m}function d(e,t){if(e.done)return;e.done=true;var r=e.dom,i=r.previousSibling,o=r.parentNode,u=r.outerHTML,f=e.expr,l=f.split(/\s+in\s+/),c=[],p,o,d;if(l[1]){f="{ "+l[1];d=l[0].slice(1).trim().split(/,\s*/)}t.one("mount",function(){var e=r.parentNode;if(e){o=e;o.removeChild(r)}});function v(){return Array.prototype.indexOf.call(o.childNodes,i)+1}t.on("updated",function(){var e=n(f,t);is_array=Array.isArray(e);if(is_array)e=e.slice(0);else{if(!e)return;var r=JSON.stringify(e);if(r==p)return;p=r;e=Object.keys(e).map(function(t,n){var r={};r[d[0]]=t;r[d[1]]=e[t];return r})}a(c,e).map(function(e){var t=c.indexOf(e);o.removeChild(o.childNodes[v()+t]);c.splice(t,1)});a(e,c).map(function(n,r){var i=e.indexOf(n);if(d&&!p){var a={};a[d[0]]=n;a[d[1]]=r;n=a}var f=s({before:o.childNodes[v()+i],parent:t,tmpl:u,item:n,root:o});t.on("update",function(){f.update(0,true)})});c=e})}e.tag=function(e,t,n){n=n||noop,i[e]=[t,n]};e.mountTo=function(e,t,n){var r=i[t];return r&&s({tmpl:r[0],fn:r[1],root:e,opts:n})};e.mount=function(n,r){if(n=="*")n=Object.keys(i).join(", ");var u=[];o(t.querySelectorAll(n),function(t){if(t.riot)return;var n=t.tagName.toLowerCase(),i=e.mountTo(t,n,r);if(i){u.push(i);t.riot=1}});return u};e.update=function(){return r=r.filter(function(e){return!!e.update()})}})(riot,document);

        provide(riot);
    });

