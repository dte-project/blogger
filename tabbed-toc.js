/*! Tabbed TOC for Blogger V2 <https://dte-project.github.io/blogger/tabbed-toc.html> */

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

    function is_int(x) {
        return typeof x === "number";
    }

    function is_object(x) {
        return typeof x === "object";
    }

    function maybe_json(x) {
        if (!is_string(x) || x.trim() === "") {
            return false;
        }
        return (
            // Maybe an empty string, array or object
            x === '""' ||
            x === '[]' ||
            x === '{}' ||
            // Maybe an encoded JSON string
            x[0] === '"' && x.slice(-1) === '"' ||
            // Maybe a numeric array
            x[0] === '[' && x.slice(-1) === ']' ||
            // Maybe an associative array
            x[0] === '{' && x.slice(-1) === '}'
        );
    }

    function str_eval(x) {
        if (is_string(x)) {
            if (x === 'true') {
                return true;
            } else if (x === 'false') {
                return false;
            } else if (x === 'null') {
                return null;
            } else if (x.slice(0, 1) === "'" && x.slice(-1) === "'") {
                return x.slice(1, -1);
            } else if (/^((\d+)?\.)?\d+$/.test(x)) {
                return +x;
            } else if (maybe_json(x)) {
                try {
                    return JSON.parse(x);
                } catch (e) {}
            }
        }
        return x;
    }

    function query(o, props, value) {
        var path = props.split('['), k;
        for (var i = 0, j = path.length; i < j - 1; ++i) {
            k = path[i].replace(/\]$/, "");
            o = o[k] || (o[k] = {});
        }
        o[path[i].replace(/\]$/, "")] = value;
    }

    function query_eval(x, eval) {
        var out = {},
            part = x.replace(/^.*?\?/, "");
        if (part === "") {
            return out;
        }
        part.split(/&(?:amp;)?/).forEach(function(v) {
            var a = v.split('='),
                key = decode(a[0]),
                value = is_set(a[1]) ? decode(a[1]) : true;
            value = !is_set(eval) || eval ? str_eval(value) : value;
            // `a[b]=c`
            if (key.slice(-1) === ']') {
                query(out, key, value);
            // `a=b`
            } else {
                out[key] = value;
            }
        });
        return out;
    }

    function extend(a, b) {
        b = b || {};
        for (var i in b) {
            if (b[i] === null && is_set(a[i])) {
                delete a[i];
            } else if (is_object(b[i])) {
                if (is_object(a[i])) {
                    extend(a[i], b[i]);
                } else {
                    a[i] = b[i];
                }
            } else {
                a[i] = b[i];
            }
        }
        return a;
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

    function insert(container, el, before) {
        container.insertBefore(el, before);
    }

    var tabs = {},
        tabs_indexes = [],
        panels = {}, clicked,
        hash = Date.now(),
        infinity = 9999,
        storage = win.localStorage,
        defaults = {
            source: '//dte-history.blogspot.com',
            url: location.protocol + '//' + location.host,
            name: 'tabbed-toc',
            sort: 1, // `1` or `-1` or `function_name`
            ad: true,
            active: 0, // the first tab
            container: 0, // `false`
            date: '%D+, %D %M+ %Y %h:%m', // `false` to hide
            excerpt: 0, // `false`
            image: 0, // `false`
            target: 0, // `_self`
            load: 0, // `0` to load immediately, `true` to load on `window.onload` event
            recent: 7,
            hide: [], // list of label name to hide
            text: {
                title: 'Table of Content',
                loading: 'Loading&hellip;',
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
                'alt': 'json-in-script',
                'orderby': 'published'
            }
        },
        head = doc.head,
        body = doc.body,
        html = body.parentNode,
        script = doc.currentScript || doc.getElementsByTagName('script').pop(),
        settings = extend(defaults, query_eval(script.src));

    function param(o, separator) {
        var s = [], i;
        for (i in o) {
            s.push(encode(i) + '=' + encode(o[i]));
        }
        return '?' + s.join(separator || '&');
    }

    function load(url, fn, attr) {
        var css = /\.css([?&#].*)?$/i.test(url),
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
                    fn($);
                }
            };
        } else {
            on($, "load", fn);
        }
        insert(head, $, head.firstChild);
        return $;
    }

    var url = settings.url.split(/[?&#]/)[0].replace(/\/+$/, ""),
        name = settings.name,
        ad = settings.ad,
        text = settings.text,
        container = el('div', '<h3 class="' + name + '-title">' + text.title + '</h3>', {
            'class': name,
            'id': name + ':' + hash
        });

    if (ad === true) {
        ad = 3;
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
            time = a[1].split('+')[0].split(':');
        var symbols = {
            'M+': text.months[+date[1] - 1],
            'D+': text.days[(new Date(s)).getDay()],
            'Y': date[0],
            'M': date[1],
            'D': date[2],
            'h': time[0],
            'm': time[1],
            's': Math.floor(+time[2]) + ""
        }, i;
        for (i in symbols) {
            to = to.replace(new RegExp('%' + i.replace('+', '\\+'), 'g'), symbols[i]);
        }
        return to;
    }

    win['_' + hash] = function($) {

        $ = $.feed || {};

        var entry = $.entry || [],
            category = $.category || [],
            entry_length = entry.length,
            category_length = category.length, i, j, k;

        var sort = settings.sort;

        if (is_int(sort) || /^\-1|1$/.test(sort)) {
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
            clicked = this;
            var id = clicked.id.split(':')[1],
                term = clicked.innerHTML,
                parent = container.parentNode,
                current = tabs[term];
            for (i in tabs) {
                reset_class(tabs[i], 'active');
            }
            for (i in panels) {
                panels[i].style.display = 'none';
                panels[i].previousElementSibling.style.display = 'none';
                reset_class(panels[i], 'active');
            }
            if (!panels[term]) {
                set_class(current, 'active loading');
                var loading = el('p', text.loading, {
                        'class': name + '-loading'
                    });
                insert(container.children[2], loading);
                set_class(parent, name + '-loading');
                load(url + '/feeds/posts/summary/-/' + encode(term) + param(extend(settings.query, {
                        'max-results': infinity
                    })) + '&callback=_' + (hash + 1), function() {
                    container.children[2].removeChild(loading);
                    reset_class(parent, name + '-loading');
                    reset_class(current, 'loading');
                }, {
                    'class': name + '-js',
                    'id': name + '-js:' + id
                });
            } else {
                set_class(current, 'active');
                panels[term].style.display = "";
                panels[term].previousElementSibling.style.display = "";
                set_class(panels[term], 'active');
            }
            e.preventDefault();
        }

        var nav = el('nav', "", {
                'class': name + '-tabs p'
            }), a;

        for (i = 0; i < category_length; ++i) {
            var term = category[i].term;
            if (settings.hide.indexOf(term) > -1) {
                continue;
            }
            tabs_indexes.push(term);
            a = el('a', term, {
                'class': name + '-tab ' + name + '-tab:' + i,
                'href': '#' + name + '-panel:' + hash + '-' + i,
                'id': name + '-tab:' + hash + '-' + i,
                'title': term
            });
            on(a, "click", click);
            insert(nav, a);
            if (i < category_length - 1) {
                insert(nav, doc.createTextNode(' ')); // insert space
            }
            tabs[term] = a;
        }

        insert(container, nav);
        insert(container, el('section', "", {
            'class': name + '-panels p'
        }));

    };

    win['_' + (hash + 1)] = function($) {

        $ = $.feed || {};

        var index = clicked ? clicked.id.split(':')[1].split('-')[1] : "",
            term = clicked ? clicked.innerHTML : "",
            entry = $.entry || [],
            entry_length = entry.length,
            ol = el('ol', "", {
                'class': name + '-panel ' + name + '-panel:' + index + ' active',
                'id': name + '-panel:' + hash + '-' + index
            }), li, i, j, k;

        for (i = 0; i < entry_length; ++i) {
            var suffix = i <= settings.recent ? text.recent : "";
            entry[i].marked = !!suffix;
            entry[i].title.$t += suffix;
        }

        var sort = settings.sort;

        if (is_int(sort) || /^\-1|1$/.test(sort)) {
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

        function list(current) {
            if (!current) return;
            var date = current.published.$t, url;
            for (j = 0, k = current.link.length; j < k; ++j) {
                if (current.link[j].rel === "alternate") {
                    url = current.link[j].href;
                    break;
                }
            }
            var str = "";
            str += '<h5 class="' + name + '-title"><a href="' + url + '"' + (target ? ' target="' + target + '"' : "") + '>' + current.title.$t + '</a></h5>';
            if (settings.date) {
                str += '<p class="' + name + '-time"><time datetime="' + date + '">' + format(date, settings.date) + '</time></p>';
            }
            if (size) {
                var has_image = 'media$thumbnail' in current;
                if (size === true) size = 80;
                str += '<p class="' + name + '-image' + (has_image ? "" : ' no-image') + '">';
                str += has_image ? '<img alt="" src="' + current.media$thumbnail.url.replace(/\/s\d+(-c)?\//g, '/s' + size + '-c/') + '" style="display:block;width:' + size + 'px;height:' + size + 'px;">' : '<span class="img" style="display:block;width:' + size + 'px;height:' + size + 'px;">';
                str += '</p>';
            }
            if (excerpt) {
                var summary = current.summary.$t.trim().replace(/<.*?>/g, "").replace(/[<>]/g, ""),
                    has_excerpt = summary.length;
                if (excerpt === true) excerpt = 200;
                str += '<p class="' + name + '-excerpt' + (has_excerpt ? "" : ' no-excerpt') + '">' + summary.slice(0, excerpt) + (has_excerpt > excerpt ? '&hellip;' : "") + '</p>';
            }
            return el('li', str, {
                'class': current.marked ? 'recent' : false
            });
        }

        for (i = 0; i < entry_length; ++i) {
            insert(ol, list(entry[i]));
        }

        if (_show()) {
            if (!win['_' + hash + '_']) {
                win['_' + hash + '_'] = function($) {
                    $ = $.feed || {};
                    var entry = $.entry || [],
                        entry_length = entry.length;
                    entry = entry[Math.floor(Math.random() * entry_length)];
                    if (entry = list(entry)) {
                        set_class(entry, 'ad');
                        insert(ol, entry, ol.firstChild);
                    }
                };
            }
            load(defaults.source + '/feeds/posts/summary' + param(extend(settings.query, {
                'max-results': null
            })) + '&q=' + encode(term) + '&callback=_' + hash + '_');
        }

        insert(container.children[2], el('h4', term, {
            'class': name + '-title'
        }));
        insert(container.children[2], ol);

        panels[term] = ol;

    };

    function fire() {
        load(script.src.split(/[?&#]/)[0].replace(/\.js$/, '.css'));
        load(url + '/feeds/posts/summary' + param(extend(settings.query, {
            'max-results': 0
        })) + '&callback=_' + hash, function() {
            var c = settings.container;
            if (c) {
                c = doc.querySelector(c);
                c && insert(c, container);
            } else {
                insert(script.parentNode, container, script);
            }
            reset_class(container.parentNode, name + '-loading');
            var active = settings.active;
            if (is_int(active)) {
                active = tabs_indexes[active];
            }
            tabs[active] && tabs[active].click();
        });
    }

    if (is_int(settings.load)) {
        win.setTimeout(fire, settings.load);
    } else if (settings.load === true) {
        on(win, "load", fire);
    } else {
        fire();
    }

})(window, document);