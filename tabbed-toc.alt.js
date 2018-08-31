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

    function is_number(x) {
        return typeof x === "number" || /^-?(\d*\.)?\d+$/.test(x);
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
            } else if (/^-?(\d*\.)?\d+$/.test(x) && x >= Number.MIN_SAFE_INTEGER && x <= Number.MAX_SAFE_INTEGER) {
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

    function insert(container, el, before) {
        container.insertBefore(el, before);
    }

    function detach(el) {
        el.parentNode && el.parentNode.removeChild(el);
    }

    var script = doc.currentScript || doc.getElementsByTagName('script').pop(),
        tabs = {},
        tabs_indexes = [],
        panels = {}, clicked,
        infinity = 9999,
        loc = win.location,
        storage = win.localStorage,
        defaults = {
            direction: 'ltr',
            hash: Date.now(),
            url: loc.protocol + '//' + loc.host,
            // id: 0,
            name: 'tabbed-toc',
            css: canon(script.src, 'css').replace('.alt.', '.'),
            sort: -1,
            ad: true,
            active: 0,
            container: 0,
            tab: '%Y %M+',
            // <https://en.wikipedia.org/wiki/Date_and_time_notation_in_the_United_States>
            date: '%M+ %D, %Y %h:%m %?',
            excerpt: 0,
            image: 0,
            target: 0,
            load: 0,
            recent: 0,
            hide: [],
            text: {
                title: 'Table of Content',
                loading: 'Loading&hellip;',
                midday: ['AM', 'PM'],
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
                'orderby': 'published',
                'max-results': infinity,
                'start-index': 1
            }
        },
        head = doc.head,
        settings = extend(defaults, query_eval(script.src));

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
                    fn($);
                }
            };
        } else {
            on($, "load", fn);
        }
        insert(head, $, head.firstChild);
        return $;
    }

    var hash = settings.hash,
        url = settings.id || canon(settings.url),
        name = settings.name,
        ad = settings.ad,
        text = settings.text,
        container = el('div', '<h3 class="' + name + '-title">' + text.title + '</h3>', {
            'class': name + ' ' + settings.direction,
            'id': name + ':' + hash
        }),
        loading = el('p', text.loading, {
            'class': name + '-loading'
        });

    if (ad === true) {
        ad = 3;
    }

    // Allow to update settings through current URL query string
    var settings_alt = query_eval(loc.search);
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
            'M\\+': text.months[+date[1] - 1],
            'D\\+': text.days[(new Date(s)).getDay()],
            'h\\+': hour + "",
            'Y': date[0],
            'M': date[1],
            'D': date[2],
            'h': hour_12 + "",
            'm': time[1],
            's': Math.floor(+time[2]) + "",
            '\\?': text.midday[hour_12 < 12 || hour_12 === 24 ? 0 : 1]
        }, i;
        for (i in symbols) {
            to = to.replace(new RegExp('%' + i, 'g'), symbols[i]);
        }
        return to;
    }

    win['_' + (hash - 1)] = function($) {
        load(blogger(url) + param(extend(settings.query, {
            'callback': '_' + hash,
            'max-results': 1,
            'start-index': $.feed.openSearch$totalResults.$t
        })), function() {
            var active = settings.active;
            active = tabs_indexes[active] || active;
            tabs[active] && tabs[active].click();
        });
    };

    win['_' + hash] = function($) {

        $ = $.feed || {};

        var sort = settings.sort,
            entry = $.entry || [],
            category = [],
            category_length = 0,
            end = $.updated.$t,
            start = entry[0] && entry[0].published.$t || '1999',
            year_end = +end.split('-')[0],
            year_start = +start.split('-')[0],
            m = 13, i, j, k;

        for (i = year_end; i >= year_start; --i) {
            while (m > 1) {
                --m;
                j = i + '-' + (m < 10 ? '0' + m : m);
                category.push({
                    id: j,
                    term: format(j + '-01T00:00:00', settings.tab)
                });
                ++category_length;
            }
            m = 13;
        }

        if (is_number(sort)) {
            sort = +sort;
            category = category.sort();
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
                term = clicked.getAttribute('j'),
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
                set_class(current, 'active loading');
                insert(container.children[2], loading);
                set_class(parent, name + '-loading');
                load(blogger(url) + param(extend(settings.query, {
                    'callback': '_' + (hash + 1),
                    'published-min': term + '-01T00:00:00',
                    'published-max': term + '-30T59:59:59'
                })), function() {
                    reset_class(parent, name + '-loading');
                    reset_class(current, 'loading');
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
            e.preventDefault();
        }

        var nav = el('nav', "", {
                'class': name + '-tabs p'
            }), a;

        insert(container, nav);
        insert(container, el('section', "", {
            'class': name + '-panels p'
        }));

        for (i = 0; i < category_length; ++i) {
            var id = category[i].id,
                term = category[i].term;
            if (settings.hide.indexOf(term) > -1) {
                continue;
            }
            a = el('a', term, {
                'class': name + '-tab ' + name + '-tab:' + i,
                'href': '#' + name + '-panel:' + hash + '.' + i,
                'id': name + '-tab:' + hash + '.' + i,
                'j': category[i].id,
                'title': term
            });
            tabs_indexes.push(term);
            tabs[id] = a;
            on(a, "click", click);
            insert(nav, a);
            if (i < category_length - 1) {
                insert(nav, doc.createTextNode(' ')); // insert space
            }
            insert(container.children[2], el('h4', term, {
                'class': name + '-title'
            }));
            insert(container.children[2], panels[id] = el('ol', "", {
                'class': name + '-panel ' + name + '-panel:' + i,
                'id': name + '-panel:' + hash + '.' + i
            }));
        }

    };

    win['_' + (hash + 1)] = function($) {

        $ = $.feed || {};

        var sort = settings.sort,
            term = clicked ? clicked.getAttribute('j') : "",
            entry = $.entry || [],
            entry_length = entry.length,
            ol = panels[term], i, j, k;

        for (i = 0; i < entry_length; ++i) {
            var suffix = i <= settings.recent ? text.recent : "";
            entry[i].$ = !!suffix;
            entry[i].title.$t += suffix;
        }

        if (is_number(sort)) {
            sort = +sort;
            entry = entry.sort(function(a, b) {
                return a.published.$t.localeCompare(b.published.$t);
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
            var date = current.published.$t,
                str = "", url;
            for (j = 0, k = current.link.length; j < k; ++j) {
                if (current.link[j].rel === "alternate") {
                    url = current.link[j].href;
                    break;
                }
            }
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
                str += '<p class="' + name + '-image' + (has_image ? "" : ' no-image') + '">';
                str += has_image ? '<img alt="" src="' + current.media$thumbnail.url.replace(/\/s\d+(\-c)?\//g, '/' + size + '/') + '" style="display:block;width:' + w + ';height:' + h + ';">' : '<span class="img" style="display:block;width:' + w + ';height:' + h + ';">';
                str += '</p>';
            }
            str += '<h5 class="' + name + '-title"><a href="' + url + '"' + (target ? ' target="' + target + '"' : "") + '>' + current.title.$t + '</a></h5>';
            if (settings.date) {
                str += '<p class="' + name + '-time"><time datetime="' + date + '">' + format(date, settings.date) + '</time></p>';
            }
            if (excerpt) {
                var summary = current.summary.$t.trim().replace(/<.*?>/g, "").replace(/[<>]/g, ""),
                    has_excerpt = summary.length;
                if (excerpt === true) excerpt = 200;
                str += '<p class="' + name + '-excerpt' + (has_excerpt ? "" : ' no-excerpt') + '">' + summary.slice(0, excerpt) + (has_excerpt > excerpt ? '&hellip;' : "") + '</p>';
            }
            return el('li', str, {
                'class': current.$ ? 'recent' : false
            });
        }

        for (i = 0; i < entry_length; ++i) {
            insert(ol, list(entry[i]));
        }

        if (_show()) {
            win['_' + hash + '_'] = function($) {
                $ = $.feed || {};
                var entry = $.entry || [];
                entry = entry[Math.floor(Math.random() * entry.length)];
                if (entry = list(entry)) {
                    set_class(entry, 'ad');
                    insert(ol, entry, ol.firstChild);
                }
            };
            load(blogger('298900102869691923') + param(extend(settings.query, {
                'callback': '_' + hash + '_',
                'max-results': 21,
                'orderby': 'updated'
            })) + '&q=' + encode(term.toLowerCase()));
        } else {
            delete win['_' + hash + '_'];
        }

        panels[term].$ = true;

    };

    function fire() {
        var c = settings.container,
            css = settings.css;
        if (css) {
            load(is_string(css) ? css : canon(script.src, 'css'));
        }
        load(blogger(url) + param(extend(settings.query, {
            'callback': '_' + (hash - 1),
            'max-results': 0
        })), function() {
            if (c) {
                c = doc.querySelector(c);
                c && (c.innerHTML = ""), insert(c, container);
            } else {
                insert(script.parentNode, container, script);
            }
            reset_class(container.parentNode, name + '-loading');
        });
    }

    if (is_number(settings.load)) {
        win.setTimeout(fire, +settings.load);
    } else if (settings.load === true) {
        on(win, "load", fire);
    } else {
        fire();
    }

})(window, document);