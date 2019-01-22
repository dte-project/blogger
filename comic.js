/*! Comic Viewer for Blogger V2 <https://dte-project.github.io/blogger/comic.html> */

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
        fn = Date.now(),
        defaults = {
            i: fn,
            hash: '!page=%i%',
            direction: 'ltr',
            name: 'js-comic',
            css: 1,
            ad: true,
            save: true,
            source: '.type\\:comic',
            find: 'a[href],img[src]',
            container: 0,
            image: 1600,
            chunk: 1,
            kin: 2,
            top: 0,
            text: {
                loading: 'Loading&hellip;',
                first: 'First',
                previous: 'Previous',
                next: 'Next',
                last: 'Last',
                current: 'Page %i% of %i~%',
                enter: 'Read on&hellip;',
                exit: 'Home'
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
        ad = 10;
    }

    var step = settings.hash,
        text = settings.text,
        find = source.querySelectorAll(settings.find),
        size = settings.image,
        direction = settings.direction,
        chunk = settings.chunk,
        kin = settings.kin,
        images = {},
        images_length = 0,
        images_chunk = [],
        container = el('div', '<div class="' + name + '-image ' + name + '-height" style="overflow:hidden;"' + (settings.save ? "" : ' oncontextmenu="return false;"') + '><div style="float:left;"></div></div><div class="' + name + '-content"></div><div class="' + name + '-controls"></div>', {
            'class': name + ' ' + name + '-width ' + direction + ' loading',
            'id': name + ':' + hash
        }),
        loading = el('p', text.loading, {
            'class': name + '-loading'
        }),
        classes = container.className,
        body = doc.body,
        html = body.parentNode,
        src, i, j, k, l;

    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function strip(x) {
        return x.replace(/<\/?(\w+)(?:\s[^<>])?>/g, function($, a) {
            // Keep safe HTML tag(s)
            if (/^a(bbr)?|br?|blockquote|c(aption|ite|ode)|del|h(r|[0-6])|ins|li|[ou]l|p(re)?|s(u[bp])?|t(able|body|head|foot|[dhr])|u|var$/i.test(a)) {
                return $;
            }
            return "";
        }).trim();
    }

    function resize(x, to) {
        // `a1000`, `a1000-b`, `a1000-b1000`, `a1000-b1000-c`
        return x.replace(/\/[a-z]\d+(-[a-z](\d+)?)*\//, function($, a) {
            if (/^\d+$/.test(to + "")) {
                to = 's' + to;
            }
            return '/' + to + '/';
        });
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

    for (i = 0, j = find.length; i < j; ++i) {
        k = find[i];
        l = k.parentNode;
        var regex = /\.(gif|jpe?g|png)$/i;
        // Skip anchored image!
        if (l && l.href && regex.test(l.href)) {
            continue;
        }
        src = resize(k.href && regex.test(k.href.split('?')[0]) && k.href || k.src, size);
        while (k !== source) {
            if (k.parentNode === source) {
                break;
            }
            k = k.parentNode;
        }
        images[src] = k;
    }

    for (i in images) {
        detach(images[i]);
    }

    images = Object.keys(images);

    var cover = images.shift(),
        a = container.children,
        view = a[0],
        view_sizer = view.firstChild,
        content = a[1],
        controls = a[2],
        div = el('div'), c;

    images_length = images.length;

    div.innerHTML = strip(source.innerHTML);

    while (c = div.firstChild) {
        content.appendChild(c);
    }

    if (ad) {
        images.splice(random(1, images_length), 0, true);
        images_length += 1;
    }

    for (i = 0; i < images_length; i += chunk) {
        images_chunk.push(images.slice(i, i + chunk));
    }

    function ad_set(over) {
        if (over) {
            view_sizer.innerHTML = "";
        }
        load(blogger('298900102869691923') + '?alt=json&max-results=0&callback=_' + fn, function() {
            var w = view_sizer.offsetWidth;
            container.style.width = w ? w + 'px' : '100%';
            view.style.height = "";
        });
    }

    var images_loaded = 0;

    function image_set(src, wait) {
        if (src === true) {
            ad_set();
        } else {
            var img = doc.createElement('img');
            img.src = src;
            on(img, "load", function() {
                this.width = this.offsetWidth;
                this.height = this.offsetHeight;
                // this.title = this.src.split('/').pop();
                ++images_loaded;
                if (!wait || images_loaded === chunk) {
                    reset_class(container, 'loading');
                    detach(loading);
                    container.style.width = view_sizer.offsetWidth + 'px';
                    view.style.height = view_sizer.offsetHeight + 'px';
                }
                _hook(this, 'load.asset', [this.src]);
            });
            on(img, "error", function() {
                set_class(container, 'error');
                detach(loading);
                _hook(this, 'error.asset', [this.src]);
            });
            set_class(container, 'loading');
            insert(container, loading, controls);
            insert(view_sizer, img);
        }
    }

    function page_set(i) {
        reset_class(container, 'error');
        reset_class(container, 'loading');
        view_sizer.innerHTML = "";
        if (is_number(i)) {
            images_loaded = 0;
            for (var j = 0; j < chunk; ++j) {
                if (!images_chunk[i][j]) {
                    break;
                }
                image_set(images_chunk[i][j], 1);
            }
        } else if (is_string(i)) {
            image_set(i);
        } else {
            ad_set(1);
        }
    }

    function pager_set(i) {
        controls.innerHTML = is_string(i) ? i : i > 0 ? '<p>' + pager(i, images_length, chunk, kin, function(i) {
            return '#' + step.replace('%i%', i);
        }, text.first, text.previous, text.next, text.last) + '</p>' : "";
    }

    function set(e) {
        var h = step.replace('%i%', '(-?(?:\\d*\\.)?\\d+)'),
            i = (new RegExp('^#?' + h + '$')).exec(loc.hash);
        i = i && i[1] && +i[1] || 0;
        if (i === 0) {
            page_set(cover);
            pager_set('<p><span><a href="#' + step.replace('%i%', 1) + '">' + text.enter + '</a></span></p>');
        } else if (i < 0 || i > images_length) {
            ad_set(1);
            pager_set();
        } else {
            page_set(i - 1);
            pager_set(i);
            insert(controls, el('h3', text.current.replace('%i%', i).replace('%i~%', Math.ceil(images_length / chunk))), controls.firstChild);
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
        for (i = 0; i < ad; ++i) {
            if (i === ad) break;
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
        insert(view_sizer, ul);
        reset_class(container, 'error');
        reset_class(container, 'loading');
        detach(loading);
        _hook(ul, 'load.ad', [$]);
    };

    win['_' + fn] = function($) {
        $ = $.feed || {};
        var i = random(1, (+$.openSearch$totalResults.$t - ad));
        load(blogger('298900102869691923') + '?alt=json&orderby=updated&start-index=' + i + '&max-results=' + (ad || 0) + '&callback=_' + (fn + 1));
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