/*! Tabbed TOC for Blogger V2 <https://dte-project.github.io/blogger/tabbed-toc.html> */

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
        tabs = {},
        tabs_indexes = [],
        panels = {},
        infinity = 9999,
        fn = Date.now(),
        defaults = {
            i: fn,
            direction: 'ltr',
            url: loc.protocol + '//' + loc.host,
            // id: 0,
            name: 'tabbed-toc',
            css: 1,
            sort: 1,
            ad: true,
            active: 0,
            container: 0,
            // <https://en.wikipedia.org/wiki/Date_and_time_notation_in_the_United_States>
            date: '%M~% %D%, %Y% %h%:%m% %N%',
            excerpt: 0,
            image: 0,
            target: 0,
            load: 0,
            recent: 7,
            hide: [],
            text: {
                title: 'Table of Content',
                loading: 'Loading&hellip;',
                noon: ['AM', 'PM'],
                months: [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December'
                ],
                days: [
                    'Sunday',
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday'
                ],
                recent: ' <sup>New!</sup>'
            },
            query: {
                'alt': 'json',
                'orderby': 'published',
                'max-results': infinity,
                'start-index': 1
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

    var hash = settings.i,
        url = settings.id || canon(settings.url),
        name = settings.name,
        ad = settings.ad,
        text = settings.text,
        event = settings.e,
        container = el('div', '<h3 class="' + name + '-title">' + text.title + '</h3>', {
            'class': name + ' ' + settings.direction,
            'id': name + ':' + hash
        }),
        loading = el('p', text.loading, {
            'class': name + '-loading'
        }), ol, list;

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

    // `2018-08-13T13:07:10.001+07:00`
    function format(s, to) {
        var a = s.split('T'),
            date = a[0].split('-'),
            time = a[1].split('+')[0].split(':'),
            hour = +time[0],
            hour_12 = hour % 12 || 12;
        var symbols = {
            'M~': text.months[+date[1] - 1],
            'D~': text.days[(new Date(s)).getDay()],
            'h~': hour + "",
            'Y': date[0],
            'M': date[1],
            'D': date[2],
            'h': hour_12 + "",
            'm': time[1],
            's': Math.floor(+time[2]) + "",
            'N': text.noon[hour_12 < 12 || hour_12 === 24 ? 0 : 1]
        }, i;
        for (i in symbols) {
            to = to.replace(/\\%/g, '&#37;').replace(new RegExp('%' + i + '%', 'g'), symbols[i]);
        }
        return to;
    }

    win['_' + fn] = function($) {

        $ = $.feed || {};

        var sort = settings.sort,
            entry = $.entry || [],
            category = $.category || [],
            entry_length = entry.length,
            category_length = category.length, i, j, k;

        if (is_number(sort)) {
            sort = +sort;
            category = category.sort(function(a, b) {
                return a.term.localeCompare(b.term);
            });
            if (sort === -1) {
                category = category.reverse();
            }
        } else if (is_string(sort)) {
            sort = win[sort];
            category = category.sort(sort);
        }

        function click(e) {
            var id = this.id.split(':')[1],
                term = this.title,
                parent = container.parentNode,
                current = tabs[term],
                current_panel = panels[term];
            for (i in tabs) {
                if (i === term) continue;
                reset_class(tabs[i], 'active');
            }
            for (i in panels) {
                if (i === term) continue;
                reset_class(panels[i], 'active');
                panels[i].style.display = 'none';
                panels[i].previousSibling.style.display = 'none';
            }
            if (!current_panel.$) {
                set_class(current, 'loading');
                set_class(current_panel, 'loading');
                insert(container.children[2], loading);
                set_class(parent, name + '-loading');
                load(blogger(url) + '/-/' + encode(term) + param(extend(settings.query, {
                    'callback': '_' + (fn + 1)
                })), function() {
                    reset_class(parent, name + '-loading');
                    reset_class(current, 'loading');
                    reset_class(current_panel, 'loading');
                    detach(loading);
                }, {
                    'class': name + '-js',
                    'id': name + '-js:' + id
                });
            }
            set_class(current, 'active');
            set_class(current_panel, 'active');
            current_panel.style.display = "";
            current_panel.previousSibling.style.display = "";
            _hook(this, 'click', [{}, tabs, panels]);
            _hook(container, 'change', [{}, current, current_panel]);
            e.preventDefault();
        }

        var nav = el('nav', "", {
                'class': name + '-tabs p'
            }), a;

        insert(container, nav);
        insert(container, el('section', "", {
            'class': name + '-panels p'
        }));

        var hides = Object.values(settings.hide);

        for (i = 0; i < category_length; ++i) {
            var term = category[i].term;
            if (hides.indexOf(term) > -1) {
                continue;
            }
            a = el('a', term, {
                'class': name + '-tab ' + name + '-tab:' + i,
                'href': canon(settings.url) + '/search/label/' + encode(term),
                'id': name + '-tab:' + hash + '.' + i,
                'title': term
            });
            tabs_indexes.push(term);
            tabs[term] = a;
            on(a, "click", click);
            insert(nav, a);
            if (i < category_length - 1) {
                insert(nav, doc.createTextNode(' ')); // insert space
            }
            insert(container.children[2], el('h4', term, {
                'class': name + '-title'
            }));
            insert(container.children[2], panels[term] = el('ol', "", {
                'class': name + '-panel ' + name + '-panel:' + i,
                'id': name + '-panel:' + hash + '.' + i
            }));
        }

        _hook(container, 'load', [$, tabs, panels]);

    };

    win['_' + (fn + 1)] = function($) {

        $ = $.feed || {};

        var sort = settings.sort,
            term = (($.link.find(function($) {
                return $.rel === "alternate";
            }) || {}).href || "").split('/').pop(),
            entry = $.entry || [],
            entry_length = entry.length,
            i, j, k;

        ol = panels[term];

        if (entry_length && !get_class(ol, 'active')) {
            tabs[term].click();
        }

        for (i = 0; i < entry_length; ++i) {
            var suffix = i < settings.recent ? text.recent : "";
            entry[i].$ = !!suffix;
            entry[i].title.$t += suffix;
        }

        if (is_number(sort)) {
            sort = +sort;
            entry = entry.sort(function(a, b) {
                return a.title.$t.localeCompare(b.title.$t);
            });
            if (sort === -1) {
                entry = entry.reverse();
            }
        } else if (is_string(sort)) {
            sort = win[sort];
            entry = entry.sort(sort);
        }

        var target = settings.target,
            size = settings.image,
            excerpt = settings.excerpt,
            state = 'has-title has-url';

        if (settings.date) state += ' has-time';
        if (size) state += ' has-image';
        if (excerpt) state += ' has-excerpt';

        set_class(container, state);

        list = function(current) {
            if (!current) return;
            var date = current.published.$t,
                url = (current.link.find(function($) {
                    return $.rel === "alternate";
                }) || {}).href,
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
            str += '<h5 class="' + name + '-title"><a href="' + url + '"' + (target ? ' target="' + target + '"' : "") + '>' + current.title.$t + '</a></h5>';
            if (settings.date) {
                str += '<p class="' + name + '-time"><time datetime="' + date + '">' + format(date, settings.date) + '</time></p>';
            }
            if (excerpt) {
                var summary = current.summary.$t.replace(/<.*?>/g, "").replace(/[<>]/g, "").trim(),
                    has_excerpt = summary.length;
                if (excerpt === true) excerpt = 200;
                str += '<p class="' + name + '-excerpt' + (has_excerpt ? "" : ' no-excerpt') + '">' + summary.slice(0, excerpt) + (has_excerpt > excerpt ? '&hellip;' : "") + '</p>';
            }
            return el('li', str, {
                'class': current.$ ? 'recent' : false
            });
        };

        for (i = 0; i < entry_length; ++i) {
            insert(ol, list(entry[i]));
        }

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
            })) + '&q=' + encode(term.toLowerCase()));
        }

        panels[term].$ = true;

        _hook(panels[term], 'load', [{}, tabs, panels]);

    };

    win['_' + fn + '_'] = function($) {
        $ = $.feed || {};
        var entry = $.entry || [];
        entry = entry[Math.floor(Math.random() * entry.length)];
        if (entry = list(entry)) {
            set_class(entry, 'ad');
            insert(ol, entry, ol.firstChild);
        }
        _hook(entry, 'load.ad', [$, tabs, panels]);
    };

    function fire() {
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
        load(blogger(url) + param(extend(settings.query, {
            'callback': '_' + fn,
            'max-results': 0
        })), function() {
            if (c) {
                c = doc.querySelector(c);
                c && (c.innerHTML = ""), insert(c, container);
            } else {
                insert(script.parentNode, container, script);
            }
            reset_class(container.parentNode, name + '-loading');
            _hook(this, 'load.asset', [this.src]);
            var active = settings.active;
            if (is_number(active)) {
                active = tabs_indexes[active];
            }
            tabs[active] && tabs[active].click();
        });
    }

    if (is_number(settings.load)) {
        win.setTimeout(fire, +settings.load);
    } else if (settings.load === true) {
        on(win, "load", fire);
    } else {
        fire();
    }

    _hook(container, 'ready', [settings, tabs, panels]);

})(window, document);