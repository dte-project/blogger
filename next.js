/*! Page Chunker for Blogger <https://dte-project.github.io/blogger/next.html> */

/* <https://github.com/tovic/query-string-parser> */
!function(n,r){function t(n,r){function t(n){return decodeURIComponent(n)}function e(n){return void 0!==n}function i(n){return"string"==typeof n}function u(n){return i(n)&&""!==n.trim()?'""'===n||"[]"===n||"{}"===n||'"'===n[0]&&'"'===n.slice(-1)||"["===n[0]&&"]"===n.slice(-1)||"{"===n[0]&&"}"===n.slice(-1):!1}function o(n){if(i(n)){if("true"===n)return!0;if("false"===n)return!1;if("null"===n)return null;if("'"===n.slice(0,1)&&"'"===n.slice(-1))return n.slice(1,-1);if(/^-?(\d*\.)?\d+$/.test(n))return+n;if(u(n))try{return JSON.parse(n)}catch(r){}}return n}function f(n,r,t){for(var e,i=r.split("["),u=0,o=i.length;o-1>u;++u)e=i[u].replace(/\]$/,""),n=n[e]||(n[e]={});n[i[u].replace(/\]$/,"")]=t}var c={},l=n.replace(/^.*?\?/,"");return""===l?c:(l.split(/&(?:amp;)?/).forEach(function(n){var i=n.split("="),u=t(i[0]),l=e(i[1])?t(i[1]):!0;l=!e(r)||r?o(l):l,"]"===u.slice(-1)?f(c,u,l):c[u]=l}),c)}n[r]=t}(window,"q2o");

(function(win, doc) {

    function is_set(x) {
        return typeof x !== "undefined";
    }

    function is_string(x) {
        return typeof x === "string";
    }

    function is_number(x) {
        return typeof x === "number" || /^-?(\d*\.)?\d+$/.test(x);
    }

    function is_object(x) {
        return x !== null && typeof x === "object";
    }

    function extend(a, b) {
        b = b || {};
        for (var i in a) {
            if (!is_set(b[i])) {
                b[i] = a[i];
            } else if (is_object(a[i]) && is_object(b[i])) {
                b[i] = extend(a[i], b[i]);
            }
        }
        return b;
    }

    function on(el, ev, fn) {
        el.addEventListener(ev, fn, false);
    }

    function off(el, ev, fn) {
        el.removeEventListener(ev, fn);
    }

    function el(ement, content, attr) {
        ement = doc.createElement(ement);
        if (is_set(content) && content !== "") {
            ement.innerHTML = content;
        }
        if (is_object(attr)) {
            for (var i in attr) {
                if (attr[i] === false) continue;
                ement.setAttribute(i, attr[i]);
            }
        }
        return ement;
    }

    function set_class(el, name) {
        name = name.split(/\s+/);
        var current;
        while (current = name.shift()) el.classList.add(current);
    }

    function reset_class(el, name) {
        name = name.split(/\s+/);
        var current;
        while (current = name.shift()) el.classList.remove(current);
    }

    function get_class(el, name) {
        return el.classList.contains(name);
    }

    function insert(container, el, before) {
        el && container.insertBefore(el, before);
    }

    function detach(el) {
        el.parentNode && el.parentNode.removeChild(el);
    }

    var q2o = win.q2o,
        script = doc.currentScript,
        loc = win.location,
        storage = win.localStorage,
        fn = Date.now(),
        defaults = {
            i: fn,
            hash: '!page=%i%',
            direction: 'ltr',
            name: 'js-next',
            css: 1,
            ad: true,
            source: '.type\\:next',
            container: 0,
            kin: 2,
            top: 15,
            text: {
                loading: 'Loading&hellip;',
                error: 'Not found.',
                first: 'First',
                previous: 'Previous',
                next: 'Next',
                last: 'Last',
                current: 'Page %i% of %i~%'
            }
        },
        head = doc.head,
        settings = extend(defaults, q2o(script.src));

    var source = doc.querySelector(settings.source);

    if (!source) return;

    function canon(url, x) {
        url = (url + "").split(/[?&#]/)[0].replace(/\/+$/, "");
        if (is_set(x)) {
            url = url.replace(/\.[\w-]+$/, x ? '.' + x : "");
        }
        return url;
    }

    function blogger(id) {
        return (loc.protocol === 'file:' ? 'https:' : "") + '//www.blogger.com/feeds/' + id + '/posts/summary';
    }

    function load(url, fn, attr) {
        var css = /\.css$/i.test(canon(url)),
            $ = el(css ? 'link' : 'script', "", extend(css ? {
                'href': url,
                'rel': 'stylesheet'
            } : {
                'src': url
            }, attr));
        if ($.readyState) {
            $.onreadystatechange = function() {
                if ($.readyState === "loaded" || $.readyState === "complete") {
                    $.onreadystatechange = null;
                    fn && fn($);
                }
            };
        } else {
            fn && on($, "load", fn);
        }
        insert(head, $, head.firstChild);
        return $;
    }

    // Allow to update settings through current URL query string
    var settings_alt = q2o(loc.search);
    if (is_set(settings_alt[hash])) {
        settings = extend(settings, settings_alt[hash]);
    }

    var hash = settings.i,
        name = settings.name,
        ad = settings.ad,
        event = settings.e;

    event = event && win[event];

    function _hook(target, type, args) {
        args = args || [];
        args.unshift(type);
        typeof event === "function" && event.apply(target, args);
    }

    if (ad === true) {
        ad = 3;
    }

    var step = settings.hash,
        text = settings.text,
        size = settings.image,
        direction = settings.direction,
        kin = settings.kin,
        chunks = {},
        chunks_length = 0,
        container = el('div', '<div class="' + name + '-content"></div><div class="' + name + '-controls"></div>', {
            'class': name + ' ' + direction,
            'id': name + ':' + hash
        }),
        loading = el('p', text.loading, {
            'class': name + '-loading'
        }),
        classes = container.className,
        body = doc.body,
        html = body.parentNode,
        src, i, j, k;

    function _show() {
        if (ad !== false) {
            var i = +(storage.getItem(name) || -1);
            if (i > ad) {
                storage.setItem(name, 0);
                return true;
            }
            storage.setItem(name, ++i);
        }
        return false;
    }

    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // <http://salman-w.blogspot.com/2014/04/stackoverflow-like-pagination.html>
    function pager(current, count, chunk, kin, fn, first, previous, next, last) {
        var begin = 1,
            end = Math.ceil(count / chunk),
            s = "",
            i, min, max;
        if (end <= 1) {
            return;
        }
        if (current <= kin + kin) {
            min = begin;
            max = Math.min(begin + kin + kin, end);
        } else if (current > end - kin - kin) {
            min = end - kin - kin;
            max = end;
        } else {
            min = current - kin;
            max = current + kin;
        }
        if (previous) {
            s = '<span>';
            if (current === begin) {
                s += '<b title="' + previous + '">' + previous + '</b>';
            } else {
                s += '<a href="' + fn(current - 1) + '" title="' + previous + '" rel="prev">' + previous + '</a>';
            }
            s += '</span> ';
        }
        if (first && last) {
            s += '<span>';
            if (min > begin) {
                s += '<a href="' + fn(begin) + '" title="' + first + '" rel="prev">' + begin + '</a>';
                if (min > begin + 1) {
                    s += ' <span>&hellip;</span>';
                }
            }
            for (i = min; i <= max; ++i) {
                if (current === i) {
                    s += ' <b title="' + i + '">' + i + '</b>';
                } else {
                    s += ' <a href="' + fn(i) + '" title="' + i + '" rel="' + (current >= i ? 'prev' : 'next') + '">' + i + '</a>';
                }
            }
            if (max < end) {
                if (max < end - 1) {
                    s += ' <span>&hellip;</span>';
                }
                s += ' <a href="' + fn(end) + '" title="' + last + '" rel="next">' + end + '</a>';
            }
            s += '</span>';
        }
        if (next) {
            s += ' <span>';
            if (current === end) {
                s += '<b title="' + next + '">' + next + '</b>';
            } else {
                s += '<a href="' + fn(current + 1) + '" title="' + next + '" rel="next">' + next + '</a>';
            }
            s += '</span>';
        }
        return s;
    }

    var div = el('div'),
        show = _show(), c;
    chunks[chunks_length] = div;
    while (c = source.firstChild) {
       // `<!-- next -->`
       if (c && c.nodeType === 8 && c.nodeValue.trim().toLowerCase() === 'next') {
           div = el('div');
           ++chunks_length;
           chunks[chunks_length] = div;
           detach(c);
           continue;
       }
       insert(div, c);
    }
    chunks_length += show ? 2 : 1;

    var a = container.children,
        content = a[0],
        controls = a[1];

    function ad_set(over) {
        content.innerHTML = "";
        insert(container, loading, controls);
        load(blogger('298900102869691923') + '?alt=json&max-results=0&callback=_' + fn);
    }

    function page_set(i) {
        c = content.firstChild;
        c && detach(c);
        if (is_set(chunks[i])) {
            detach(loading);
            insert(content, chunks[i]);
            asset_set(); // load asset(s)
        } else {
            ad_set();
        }
    }

    function asset_set() {
        var assets = content.querySelectorAll('[data-src]'),
            asset_error = function() {
                set_class(this, 'error');
                _hook(this, 'error.asset', [this.src]);
            },
            asset_load = function() {
                reset_class(this, 'loading');
                _hook(this, 'load.asset', [this.src]);
            };
        for (i = 0, j = assets.length; i < j; ++i) {
            k = assets[i];
            set_class(k, 'loading');
            k.src = k.getAttribute('data-src');
            k.removeAttribute('data-src');
            on(k, "error", asset_error);
            on(k, "load", asset_load);
        }
    }

    function pager_set(i) {
        if (chunks_length > 1) {
            controls.innerHTML = is_string(i) ? i : i > 0 ? '<p>' + pager(i, chunks_length, 1, kin, function(i) {
                return '#' + step.replace('%i%', i);
            }, text.first, text.previous, text.next, text.last) + '</p>' : "";
        }
    }

    function set(e) {
        var h = step.replace('%i%', '(-?(?:\\d*\\.)?\\d+)'),
            i = (new RegExp('^#?' + h + '$')).exec(loc.hash),
            c = classes;
        i = i && i[1] && +i[1] || 1;
        if (i < 1 || i > chunks_length) {
            ad_set();
            pager_set();
            classes = c + ' loading';
        } else {
            page_set(i - 1);
            pager_set(i);
            chunks_length > 1 && insert(controls, el('h3', text.current.replace('%i%', i).replace('%i~%', chunks_length)), controls.firstChild);
            classes = c;
        }
        container.className = classes + ' step-' + i;
        e && _hook(container, 'change', [i]);
    } set();

    on(win, "hashchange", set);

    on(controls, "click", function(e) {
        var $ = e.target,
            t = settings.top, top;
        if ($.nodeName.toLowerCase() === 'a') {
            if (t !== false) {
                top = container.getBoundingClientRect().top - t;
                body.scrollTop += top;
                html.scrollTop += top;
            }
            loc.hash = $.hash;
            _hook($, 'click', [$.href]);
            e.preventDefault();
        }
    });

    win['_' + (fn + 1)] = function($) {
        $ = $.feed || {};
        var entry = $.entry || [],
            entry_length = entry.length,
            ul = el('ul', "", {
                'class': name + '-ads'
            }),
            ss = ' style="display:block;width:80px;height:80px;">',
            i, j, s;
        if (!entry_length) return;
        for (i = 0; i < entry_length; ++i) {
            j = entry[i];
            s = 'media$thumbnail' in j ? '<img alt="" src="' + j.media$thumbnail.url.replace(/\/s\d+(-c)?\//, '/s80-c/') + '" width="80" height="80"' + ss : '<span class="img"' + ss + '</span>';
            var url = (j.link.find(function($) {
                return $.rel === "alternate";
            }) || {}).href;
            if (!url) continue;
            s += '<h3><a href="' + url + '" target="_blank">' + $.title.$t + ' &middot; ' + j.title.$t + '</a></h3>';
            s += '<p>' + j.summary.$t.replace(/<.*?>/g, "").replace(/[<>]/g, "").slice(0, 200) + '&hellip;</p>';
            insert(ul, el('li', s));
        }
        insert(content, ul);
        reset_class(container, 'loading');
        detach(loading);
        _hook(ul, 'load.ad', [$]);
    };

    win['_' + fn] = function($) {
        $ = $.feed || {};
        var i = random(1, (+$.openSearch$totalResults.$t - 10));
        load(blogger('298900102869691923') + '?alt=json&orderby=updated&start-index=' + i + '&max-results=10&callback=_' + (fn + 1));
    };

    if (!script.id) {
        script.id = name + '-js';
    }

    set_class(script, name + '-js');

    var c = settings.container,
        css = settings.css;

    if (css && !doc.getElementById(name + '-css')) {
        load(is_string(css) ? css : canon(script.src, 'css'), function() {
            _hook(this, 'load.asset', [this.href]);
        }, {
            'class': name + '-css',
            'id': name + '-css'
        });
    }

    if (c) {
        source.style.display = 'none';
        source = doc.querySelector(c);
    }

    source.innerHTML = "";
    insert(source, container);

    _hook(container, 'ready', [settings, container]);

})(window, document);