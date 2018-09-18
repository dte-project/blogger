/*! <https://github.com/tovic/query-string-parser> */
!function(e,n){function t(e,n,t,l){function r(e){return encodeURIComponent(e)}function s(e){return null!==e&&"object"==typeof e}function a(e){return e===!0?"true":e===!1?"false":null===e?"null":s(e)?JSON.stringify(e):e+""}function c(e,n,t,l){t=t||0;var a,i,o,u=[],p=n?"%5D":"";for(a in e)i=r(a),o=e[a],s(o)&&l>t?Object.assign(u,c(o,n+i+p+"%5B",t+1,l)):u[n+i+p]=o;return u}t=t||1;var i,o,u=[],p=c(e,"",0,t);for(i in p)o=p[i],(o!==!1||l)&&(o=o!==!0?"="+r(a(o)):"",u.push(i+o));return u.length?"?"+u.join(n||"&"):""}e[n]=t}(window,"o2q");

/*! ... */

function myHookFn() {
    console.log([arguments[0], this, arguments]);
}

(function(window, document) {

var search = location.search,
    skin = /[?&]skin=(.*?)(?:&|$)/.exec(search),
    css = /[?&]css=(.*?)(?:&|$)/.exec(search),
    skins = document.getElementById('skins'),
    settings = document.getElementById('settings'),
    results = document.getElementById('results'),
    demo = document.getElementById('views'),
    url = location.href.split(/[?&#]/)[0], timer, skin_url, z;
skin = skin && skin[1] || "";
css = css && css[1] && decodeURIComponent(css[1]) || "";
skin_url = url.replace(/^https?:/, "").replace(/\.html$/, '/%{name}%.css');

function _focus() {
    this.select();
}

// settings.onfocus = _focus;
results.onfocus = _focus;

function change() {
    demo.innerHTML = 'Loading&hellip;';
    timer && clearTimeout(timer);
    timer = setTimeout(function() {
        z = 0;
        var x, y;
        if (x = document.getElementById('test-css')) {
            x.parentNode.removeChild(x);
        }
        if (y = skins.value) {
            var link = document.createElement('link');
            link.href = (z = skin_url.replace('%{name}%', y)) + '?v=' + Date.now();
            link.rel = 'stylesheet';
            link.id = 'test-css';
            document.head.appendChild(link);
        }
        update(), change2();
    }, 1000);
} change();

skins.onchange = change;

skin && (skins.value = skin);

function update() {
    value = (settings.value.trim() || '{}')
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^[ ]*\/\/.*/gm, "")
        .replace(/[ ]*\/\/[^"'\n]*$/gm, "")
        .replace(/\s*,\s*(?=[\]\}])/g, "");
    try {
        var src = url.replace(/^https?:/, "").replace(/\.html$/, '.js'), el;
        value = JSON.parse(value);
        results.value = (z ? '<link href="' + z.replace(/\.css$/, '.min.css') + '" rel="stylesheet">\n' : "") + (css ? '<style>\n' + css + '\n</style>\n' : "") + '<scr' + 'ipt src="' + src.replace(/\.js$/, '.min.js') + o2q(value, '&amp;', 1, true) + '"></scr' + 'ipt>';
        var script = document.createElement('script');
        script.id = 'test-js';
        if (!value.i) {
            value.i = 1;
        }
        value.e = 'myHookFn';
        value.id = '"298900102869691923"';
        // value.ad = false;
        value.container = '#views';
        if (value.load === true) {
            value.load = 0;
        }
        script.src = src + o2q(value, '&', 1, true) + '&v=' + Date.now();
        if (el = document.getElementById('test-js')) {
            el.parentNode.removeChild(el);
        }
        document.body.appendChild(script);
    } catch (e) {
        results.value = e;
    }
}

settings.onkeyup = change;
settings.onpaste = change;
settings.oncut = change;

var style = document.createElement('style');
document.body.appendChild(style);

function change2() {
    var style_content = /<style(?:\s[^<>]*?)?>([\s\S]*?)<\/style>/.exec(results.value);
    style.innerHTML = style_content && style_content[1] || "";
} change2();

results.onkeyup = change2;
results.onpaste = change2;
results.oncut = change2;

})(window, document);