/*! AJAX Search Widget for Blogger V2 <https://dte-project.github.io/blogger/search.html> */

/* <https://github.com/tovic/query-string-parser> */
!function(n,r){function t(n,r){function t(n){return decodeURIComponent(n)}function e(n){return void 0!==n}function i(n){return"string"==typeof n}function u(n){return i(n)&&""!==n.trim()?'""'===n||"[]"===n||"{}"===n||'"'===n[0]&&'"'===n.slice(-1)||"["===n[0]&&"]"===n.slice(-1)||"{"===n[0]&&"}"===n.slice(-1):!1}function o(n){if(i(n)){if("true"===n)return!0;if("false"===n)return!1;if("null"===n)return null;if("'"===n.slice(0,1)&&"'"===n.slice(-1))return n.slice(1,-1);if(/^-?(\d*\.)?\d+$/.test(n))return+n;if(u(n))try{return JSON.parse(n)}catch(r){}}return n}function f(n,r,t){for(var e,i=r.split("["),u=0,o=i.length;o-1>u;++u)e=i[u].replace(/\]$/,""),n=n[e]||(n[e]={});n[i[u].replace(/\]$/,"")]=t}var c={},l=n.replace(/^.*?\?/,"");return""===l?c:(l.split(/&(?:amp;)?/).forEach(function(n){var i=n.split("="),u=t(i[0]),l=e(i[1])?t(i[1]):!0;l=!e(r)||r?o(l):l,"]"===u.slice(-1)?f(c,u,l):c[u]=l}),c)}n[r]=t}(window,"q2o");

(function(win, doc) {

    function encode(x) {
        return encodeURIComponent(x);
    }

    function decode(x) {
        return decodeURIComponent(x);
    }

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
        query = "", // current search query
        start = 1, // current search start index
        caches = {}, // search result(s) cache
        fn = Date.now(),
        defaults = {
            i: fn,
            direction: 'ltr',
            url: loc.protocol + '//' + loc.host,
            // id: 0,
            name: 'js-search',
            css: 1,
            ad: true,
            live: true,
            source: 'form[action$="/search"]',
            container: 0,
            excerpt: 0,
            image: 0,
            target: 0,
            chunk: 50,
            text: {
                title: 'Search results for query <em>%s%</em>',
                loading: 'Searching&hellip;',
                previous: 'Previous',
                next: 'Next',
                empty: 'No results for query <em>%s%</em>.',
                end: 'No more results for query <em>%s%</em>.'
            },
            query: {
                'alt': 'json',
                'orderby': 'updated'
            }
        },
        head = doc.head,
        settings = extend(defaults, q2o(script.src));

    function param(o, separator) {
        var s = [], i;
        for (i in o) {
            s.push(encode(i) + '=' + encode(o[i]));
        }
        return '?' + s.join(separator || '&');
    }

    function canon(url, x) {
        url = (url + "").split(/[?&#]/)[0].replace(/\/+$/, "");
        if (is_set(x)) {
            url = url.replace(/\.[\w-]+$/, x ? '.' + x : "");
        }
        return url;
    }

    function blogger(url) {
        // `url` is a blog ID
        if (is_number(url)) {
            return (loc.protocol === 'file:' ? 'https:' : "") + '//www.blogger.com/feeds/' + url + '/posts/summary';
        }
        // `url` is a blog URL
        return canon(url) + '/feeds/posts/summary';
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

    var source = doc.querySelector(settings.source);

    if (!source) return;

    var hash = settings.i,
        url = settings.id || canon(settings.url),
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

    // Allow to update settings through current URL query string
    var settings_alt = q2o(loc.search);
    if (is_set(settings_alt[hash])) {
        delete settings_alt[hash].url; // but `url`
        settings = extend(settings, settings_alt[hash]);
    }

    var text = settings.text,
        chunk = settings.chunk,
        bounds = settings.container && doc.querySelector(settings.container) || doc.body,
        container = el('div', '<div></div>', {
            'class': name + ' ' + settings.direction,
            'id': name + ':' + hash
        }),
        div = el('div'),
        title = el('h3', "", {
            'class': name + '-title'
        }),
        ol = el('ol', "", {
            'class': name + '-results',
            'id': name + '-results:' + hash,
            'start': start
        }),
        nav = el('nav', "", {
            'class': name + '-pager',
            'id': name + '-pager:' + hash
        }),
        previous = el('a', text.previous, {
            'class': name + '-previous',
            'href': "",
            'rel': 'prev'
        }),
        next = el('a', text.next, {
            'class': name + '-next',
            'href': "",
            'rel': 'next'
        }),
        loading = el('p', text.loading, {
            'class': name + '-loading'
        }), list;

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

    function ent(text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function mark(text) {
        if (!query) {
            return text;
        }
        var q = query.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\\\$&');
        q = q.replace(/\s+/g, '\\s+');
        q = new RegExp(q, 'i');
        return text.replace(q, '<mark>$&</mark>');
    }

    function get_css(prop) {
        return win.getComputedStyle(bounds).getPropertyValue(prop);
    }

    function fit(e) {
        if (settings.container || !container.parentNode) return;
        var rect = source.getBoundingClientRect(),
            T = rect.top,
            L = rect.left,
            W = rect.width,
            H = rect.height;
        set_class(container, name + '-float');
        container.style.cssText = 'background-color:' + get_css('background-color') + ';color:' + get_css('color') + ';position:fixed;z-index:9999;top:' + (T + H) + 'px;left:' + L + 'px;width:' + W + 'px;max-height:' + (win.innerHeight - T - H) + 'px;overflow:auto;';
        _hook(container, e && e.type || 'fit', [rect]);
    }

    on(win, "scroll", fit);
    on(win, "resize", fit);

    win['_' + fn] = function($) {

        $ = $.feed || {};

        var entry = $.entry || [],
            entry_length = entry.length,
            i, j, k;

        var target = settings.target,
            size = settings.image,
            excerpt = settings.excerpt,
            state = 'has-title has-url';

        if (size) state += ' has-image';
        if (excerpt) state += ' has-excerpt';

        set_class(container, state);

        list = function(current) {
            if (!current) return;
            var url = (current.link.find(function($) {
                    return $.rel === "alternate";
                }) || {}).href;
                str = "";
            if (!url) return;
            if (size) {
                var has_image = 'media$thumbnail' in current,
                    w, h, r;
                if (size === true) size = 80;
                if (is_number(size)) {
                    w = h = size + 'px';
                    size = 's' + size + '-c';
                } else if (r = /^s(\d+)(\-[cp])?$/.exec(size)) {
                    w = r[1] + 'px';
                    h = r[2] ? r[1] + 'px' : 'auto';
                } else if (r = /^w(\d+)\-h(\d+)(\-[cp])?$/.exec(size)) {
                    w = r[1] + 'px';
                    h = r[2] + 'px';
                }
                str += '<p class="' + name + '-image ' + (has_image ? 'loading' : 'no-image') + '">';
                str += has_image ? '<img alt="" src="' + current.media$thumbnail.url.replace(/\/s\d+(\-c)?\//g, '/' + size + '/') + '" style="display:block;width:' + w + ';height:' + h + ';">' : '<span class="img" style="display:block;width:' + w + ';height:' + h + ';">';
                str += '</p>';
            }
            str += '<h4 class="' + name + '-title"><a href="' + url + '"' + (target ? ' target="' + target + '"' : "") + '>' + mark(current.title.$t) + '</a></h4>';
            if (excerpt) {
                var summary = current.summary.$t.replace(/<.*?>/g, "").replace(/[<>]/g, "").trim(),
                    has_excerpt = summary.length;
                if (excerpt === true) excerpt = 200;
                str += '<p class="' + name + '-excerpt' + (has_excerpt ? "" : ' no-excerpt') + '">' + mark(summary.slice(0, excerpt)) + (has_excerpt > excerpt ? '&hellip;' : "") + '</p>';
            }
            return el('li', str);
        };

        ol.innerHTML = "";
        for (i = 0; i < entry_length; ++i) {
            insert(ol, list(entry[i]));
        }

        detach(loading);

        previous.style.display = start > 1 ? "" : 'none';
        next.style.display = chunk > entry_length ? 'none' : "";

        insert(nav, previous);
        insert(nav, doc.createTextNode(' ')); // insert space
        insert(nav, next);
        var k = container.children[0];
        insert(k, title);
        insert(k, ol);
        insert(k, nav);

        if (size) {
            var img = ol.getElementsByTagName('img'),
                img_error = function() {
                    set_class(this.parentNode, 'error');
                    _hook(this, 'error.asset', [this.src]);
                },
                img_load = function() {
                    reset_class(this.parentNode, 'loading');
                    _hook(this, 'load.asset', [this.src]);
                };
            for (i = 0, j = img.length; i < j; ++i) {
                on(img[i], "error", img_error);
                on(img[i], "load", img_load);
            }
        }

        if (_show()) {
            load(blogger('298900102869691923') + param(extend(settings.query, {
                'callback': '_' + fn + '_',
                'max-results': 21,
                'orderby': 'updated'
            })) + '&q=' + encode(query));
        }

        _hook(container, 'load', [$, query, start]);

    };

    win['_' + fn + '_'] = function($) {
        $ = $.feed || {};
        var entry = $.entry || [];
        entry = entry[Math.floor(Math.random() * entry.length)];
        if (entry = list(entry)) {
            set_class(entry, 'ad');
            insert(ol, entry, ol.firstChild);
        }
        _hook(entry, 'load.ad', [$]);
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
        if (c = doc.querySelector(c)) {
            var i;
            while (i = c.firstChild) {
                insert(div, i);
            }
            insert(c, div);
        }
    }

    function search_cache(q, i) {
        var c = caches[q][i],
            k = container.children[0],
            p = start === 1 ? 'empty' : 'end';
        insert(k, title);
        if (c[0]) {
            previous.style.display = start > 1 ? "" : 'none';
            next.style.display = chunk > c[0] ? 'none' : "";
            ol.innerHTML = c[1];
            insert(k, ol);
        } else {
            k.innerHTML = '<p class="' + name + '-results-' + p + '">' + text[p].replace('%s%', ent(query)) + '</p>';
            next.style.display = 'none';
        }
        insert(k, nav);
        insert(bounds, container), fit();
        detach(div);
    }

    function search(q, i) {
        query = q;
        var k = container.children[0];
        insert(k, loading);
        insert(bounds, container), fit();
        detach(div);
        var parent = container.parentNode;
        set_class(parent, name + '-loading');
        load(blogger(url) + param(extend(settings.query, {
            'callback': '_' + fn,
            'max-results': chunk,
            'q': q,
            'start-index': i
        })), function() {
            reset_class(parent, name + '-loading');
            if (!is_set(caches[q])) {
                caches[q] = {};
            }
            var c = ol.innerHTML;
            caches[q][i] = [ol.children.length, c];
            search_cache(q, i);
        });
    }

    function prevent(e) {
        e && e.preventDefault();
    }

    function search_submit(e) {
        var v = this.q, cached;
        v = v && v.value;
        title.innerHTML = text.title.replace('%s%', ent(v));
        container.children[0].innerHTML = "";
        if (v) {
            v = v.toLowerCase();
            if (cached = !!(caches[v] && caches[v][start])) {
                search_cache(v, start);
            } else {
                search(v, start);
            }
            _hook(source, 'search', [v, start, cached, container]);
        } else {
            insert(bounds, div);
            detach(container);
        }
    }

    var live = settings.live,
        throttle;

    function search_key(e) {
        var t = this;
        if (e.key && e.key === 'Enter' || e.keyCode && e.keyCode === 13) {
            return;
        }
        win.setTimeout(function() {
            if (live) {
                throttle && win.clearTimeout(throttle);
                throttle = win.setTimeout(function() {
                    search_submit.call(source);
                }, is_number(live) ? +live : 500);
            } else if (t.value === "") {
                insert(bounds, div);
                detach(container);
            }
        }, 1);
    }

    on(source, "submit", function(e) {
        ol.start = (start = 1);
        throttle && win.clearTimeout(throttle);
        search_submit.call(this);
        prevent(e);
    });

    ["cut", "input", "keydown", "paste"].forEach(function(e) {
        on(source.q, e, search_key);
    });

    on(previous, "click", function(e) {
        ol.start = (start -= chunk);
        search_submit.call(source);
        prevent(e);
    });

    on(next, "click", function(e) {
        ol.start = (start += chunk);
        search_submit.call(source);
        prevent(e);
    });

    _hook(source, 'ready', [settings, container]);

})(window, document);