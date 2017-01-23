/*
 * noVNC: HTML5 VNC client
 * Copyright (C) 2012 Joel Martin
 * Copyright (C) 2017 Pierre Ossman for Cendio AB
 * Licensed under MPL 2.0 (see LICENSE.txt)
 *
 * See README.md for usage and integration instructions.
 */

/* jshint white: false, nonstandard: true */

"use strict";

define(function() {
    var Util = {};

    /*
     * Logging/debug routines
     */

    var _log_level = 'warn';
    Util.init_logging = function (level) {
        if (typeof level === 'undefined') {
            level = _log_level;
        } else {
            _log_level = level;
        }

        Util.Debug = Util.Info = Util.Warn = Util.Error = function (msg) {};
        if (typeof window.console !== "undefined") {
            /* jshint -W086 */
            switch (level) {
                case 'debug':
                    Util.Debug = function (msg) { console.log(msg); };
                case 'info':
                    Util.Info  = function (msg) { console.info(msg); };
                case 'warn':
                    Util.Warn  = function (msg) { console.warn(msg); };
                case 'error':
                    Util.Error = function (msg) { console.error(msg); };
                case 'none':
                    break;
                default:
                    throw new Error("invalid logging type '" + level + "'");
            }
            /* jshint +W086 */
        }
    };
    Util.get_logging = function () {
        return _log_level;
    };
    // Initialize logging level
    Util.init_logging();

    Util.make_property = function (proto, name, mode, type) {

        var getter;
        if (type === 'arr') {
            getter = function (idx) {
                if (typeof idx !== 'undefined') {
                    return this['_' + name][idx];
                } else {
                    return this['_' + name];
                }
            };
        } else {
            getter = function () {
                return this['_' + name];
            };
        }

        var make_setter = function (process_val) {
            if (process_val) {
                return function (val, idx) {
                    if (typeof idx !== 'undefined') {
                        this['_' + name][idx] = process_val(val);
                    } else {
                        this['_' + name] = process_val(val);
                    }
                };
            } else {
                return function (val, idx) {
                    if (typeof idx !== 'undefined') {
                        this['_' + name][idx] = val;
                    } else {
                        this['_' + name] = val;
                    }
                };
            }
        };

        var setter;
        if (type === 'bool') {
            setter = make_setter(function (val) {
                if (!val || (val in {'0': 1, 'no': 1, 'false': 1})) {
                    return false;
                } else {
                    return true;
                }
            });
        } else if (type === 'int') {
            setter = make_setter(function (val) { return parseInt(val, 10); });
        } else if (type === 'float') {
            setter = make_setter(parseFloat);
        } else if (type === 'str') {
            setter = make_setter(String);
        } else if (type === 'func') {
            setter = make_setter(function (val) {
                if (!val) {
                    return function () {};
                } else {
                    return val;
                }
            });
        } else if (type === 'arr' || type === 'dom' || type == 'raw') {
            setter = make_setter();
        } else {
            throw new Error('Unknown property type ' + type);  // some sanity checking
        }

        // set the getter
        if (typeof proto['get_' + name] === 'undefined') {
            proto['get_' + name] = getter;
        }

        // set the setter if needed
        if (typeof proto['set_' + name] === 'undefined') {
            if (mode === 'rw') {
                proto['set_' + name] = setter;
            } else if (mode === 'wo') {
                proto['set_' + name] = function (val, idx) {
                    if (typeof this['_' + name] !== 'undefined') {
                        throw new Error(name + " can only be set once");
                    }
                    setter.call(this, val, idx);
                };
            }
        }

        // make a special setter that we can use in set defaults
        proto['_raw_set_' + name] = function (val, idx) {
            setter.call(this, val, idx);
            //delete this['_init_set_' + name];  // remove it after use
        };
    };

    Util.make_properties = function (constructor, arr) {
        for (var i = 0; i < arr.length; i++) {
            Util.make_property(constructor.prototype, arr[i][0], arr[i][1], arr[i][2]);
        }
    };

    Util.set_defaults = function (obj, conf, defaults) {
        var defaults_keys = Object.keys(defaults);
        var conf_keys = Object.keys(conf);
        var keys_obj = {};
        var i;
        for (i = 0; i < defaults_keys.length; i++) { keys_obj[defaults_keys[i]] = 1; }
        for (i = 0; i < conf_keys.length; i++) { keys_obj[conf_keys[i]] = 1; }
        var keys = Object.keys(keys_obj);

        for (i = 0; i < keys.length; i++) {
            var setter = obj['_raw_set_' + keys[i]];
            if (!setter) {
              Util.Warn('Invalid property ' + keys[i]);
              continue;
            }

            if (keys[i] in conf) {
                setter.call(obj, conf[keys[i]]);
            } else {
                setter.call(obj, defaults[keys[i]]);
            }
        }
    };

    /*
     * Decode from UTF-8
     */
    Util.decodeUTF8 = function (utf8string) {
        return decodeURIComponent(escape(utf8string));
    };



    /*
     * Cross-browser routines
     */

    Util.getPosition = function(obj) {
        // NB(sross): the Mozilla developer reference seems to indicate that
        // getBoundingClientRect includes border and padding, so the canvas
        // style should NOT include either.
        var objPosition = obj.getBoundingClientRect();
        return {'x': objPosition.left + window.pageXOffset, 'y': objPosition.top + window.pageYOffset,
                'width': objPosition.width, 'height': objPosition.height};
    };

    Util.getPointerEvent = function (e) {
        var evt;
        evt = (e ? e : window.event);
        evt = (evt.changedTouches ? evt.changedTouches[0] : evt.touches ? evt.touches[0] : evt);
        return evt;
    };

    // Get mouse event position in DOM element
    Util.getEventPosition = function (e, obj, scale) {
        var evt, docX, docY, pos;
        evt = Util.getPointerEvent(e);
        if (evt.pageX || evt.pageY) {
            docX = evt.pageX;
            docY = evt.pageY;
        } else if (evt.clientX || evt.clientY) {
            docX = evt.clientX + document.body.scrollLeft +
                document.documentElement.scrollLeft;
            docY = evt.clientY + document.body.scrollTop +
                document.documentElement.scrollTop;
        }
        pos = Util.getPosition(obj);
        if (typeof scale === "undefined") {
            scale = 1;
        }
        var realx = docX - pos.x;
        var realy = docY - pos.y;
        var x = Math.max(Math.min(realx, pos.width - 1), 0);
        var y = Math.max(Math.min(realy, pos.height - 1), 0);
        return {'x': x / scale, 'y': y / scale, 'realx': realx / scale, 'realy': realy / scale};
    };

    Util.stopEvent = function (e) {
        e.stopPropagation();
        e.preventDefault();
    };

    // Touch detection
    Util.isTouchDevice = ('ontouchstart' in document.documentElement) ||
                         // requried for Chrome debugger
                         (document.ontouchstart !== undefined) ||
                         // required for MS Surface
                         (navigator.maxTouchPoints > 0) ||
                         (navigator.msMaxTouchPoints > 0);
    window.addEventListener('touchstart', function onFirstTouch() {
        Util.isTouchDevice = true;
        window.removeEventListener('touchstart', onFirstTouch, false);
    }, false);

    var _cursor_uris_supported = null;

    Util.browserSupportsCursorURIs = function () {
        if (_cursor_uris_supported === null) {
            try {
                var target = document.createElement('canvas');
                target.style.cursor = 'url("data:image/x-icon;base64,AAACAAEACAgAAAIAAgA4AQAAFgAAACgAAAAIAAAAEAAAAAEAIAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAA==") 2 2, default';

                if (target.style.cursor) {
                    Util.Info("Data URI scheme cursor supported");
                    _cursor_uris_supported = true;
                } else {
                    Util.Warn("Data URI scheme cursor not supported");
                    _cursor_uris_supported = false;
                }
            } catch (exc) {
                Util.Error("Data URI scheme cursor test exception: " + exc);
                _cursor_uris_supported = false;
            }
        }

        return _cursor_uris_supported;
    };

    // Set browser engine versions. Based on mootools.
    Util.Features = {xpath: !!(document.evaluate), air: !!(window.runtime), query: !!(document.querySelector)};

    // 'presto': (function () { return (!window.opera) ? false : true; }()),
    var detectPresto = function () {
        return !!window.opera;
    };

    // 'trident': (function () { return (!window.ActiveXObject) ? false : ((window.XMLHttpRequest) ? ((document.querySelectorAll) ? 6 : 5) : 4);
    var detectTrident = function () {
        if (!window.ActiveXObject) {
            return false;
        } else {
            if (window.XMLHttpRequest) {
                return (document.querySelectorAll) ? 6 : 5;
            } else {
                return 4;
            }
        }
    };

    // 'webkit': (function () { try { return (navigator.taintEnabled) ? false : ((Util.Features.xpath) ? ((Util.Features.query) ? 525 : 420) : 419); } catch (e) { return false; } }()),
    var detectInitialWebkit = function () {
        try {
            if (navigator.taintEnabled) {
                return false;
            } else {
                if (Util.Features.xpath) {
                    return (Util.Features.query) ? 525 : 420;
                } else {
                    return 419;
                }
            }
        } catch (e) {
            return false;
        }
    };

    var detectActualWebkit = function (initial_ver) {
        var re = /WebKit\/([0-9\.]*) /;
        var str_ver = (navigator.userAgent.match(re) || ['', initial_ver])[1];
        return parseFloat(str_ver, 10);
    };

    // 'gecko': (function () { return (!document.getBoxObjectFor && window.mozInnerScreenX == null) ? false : ((document.getElementsByClassName) ? 19ssName) ? 19 : 18 : 18); }())
    var detectGecko = function () {
        /* jshint -W041 */
        if (!document.getBoxObjectFor && window.mozInnerScreenX == null) {
            return false;
        } else {
            return (document.getElementsByClassName) ? 19 : 18;
        }
        /* jshint +W041 */
    };

    Util.Engine = {
        // Version detection break in Opera 11.60 (errors on arguments.callee.caller reference)
        //'presto': (function() {
        //         return (!window.opera) ? false : ((arguments.callee.caller) ? 960 : ((document.getElementsByClassName) ? 950 : 925)); }()),
        'presto': detectPresto(),
        'trident': detectTrident(),
        'webkit': detectInitialWebkit(),
        'gecko': detectGecko()
    };

    if (Util.Engine.webkit) {
        // Extract actual webkit version if available
        Util.Engine.webkit = detectActualWebkit(Util.Engine.webkit);
    }

    Util.Flash = (function () {
        var v, version;
        try {
            v = navigator.plugins['Shockwave Flash'].description;
        } catch (err1) {
            try {
                v = new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
            } catch (err2) {
                v = '0 r0';
            }
        }
        version = v.match(/\d+/g);
        return {version: parseInt(version[0] || 0 + '.' + version[1], 10) || 0, build: parseInt(version[2], 10) || 0};
    }());


    Util.Localisation = {
        // Currently configured language
        language: 'en',

        // Translation data
        _translations: null,

        // Configure and load suitable language based on user preferences
        setup: function (supportedLanguages, basedir, callback) {
            Util.Localisation._setLanguageCode(supportedLanguages);

            if (Util.Localisation.language === 'en') {
                if (callback !== undefined) {
                    callback();
                }

                return;
            }

            if (basedir[basedir.length - 1] !== '/') {
                basedir = basedir + '/';
            }

            require([basedir + Util.Localisation.language],
            function(lang) {
                Util.Localisation._translations = lang;

                if (callback !== undefined) {
                    callback();
                }
            });
        },

        // Internal function to figure out the proper language code
        _setLanguageCode: function (supportedLanguages) {
            var userLanguages;

            Util.Localisation.language = 'en'; // Default: US English

            /*
             * Navigator.languages only available in Chrome (32+) and FireFox (32+)
             * Fall back to navigator.language for other browsers
             */
            if (typeof window.navigator.languages == 'object') {
                userLanguages = window.navigator.languages;
            } else {
                userLanguages = [navigator.language || navigator.userLanguage];
            }

            for (var i = 0;i < userLanguages.length;i++) {
                var userLang = userLanguages[i];
                userLang = userLang.toLowerCase();
                userLang = userLang.replace("_", "-");
                userLang = userLang.split("-");

                // Built-in default?
                if ((userLang[0] === 'en') &&
                    ((userLang[1] === undefined) || (userLang[1] === 'us'))) {
                    return;
                }

                // First pass: perfect match
                for (var j = 0;j < supportedLanguages.length;j++) {
                    var supLang = supportedLanguages[j];
                    supLang = supLang.toLowerCase();
                    supLang = supLang.replace("_", "-");
                    supLang = supLang.split("-");

                    if (userLang[0] !== supLang[0])
                        continue;
                    if (userLang[1] !== supLang[1])
                        continue;

                    Util.Localisation.language = supportedLanguages[j];
                    return;
                }

                // Second pass: fallback
                for (var j = 0;j < supportedLanguages.length;j++) {
                    supLang = supportedLanguages[j];
                    supLang = supLang.toLowerCase();
                    supLang = supLang.replace("_", "-");
                    supLang = supLang.split("-");

                    if (userLang[0] !== supLang[0])
                        continue;
                    if (supLang[1] !== undefined)
                        continue;

                    Util.Localisation.language = supportedLanguages[j];
                    return;
                }
            }
        },

        // Retrieve localised text
        get: function (id) {
            if ((Util.Localisation._translations === null) ||
                (Util.Localisation._translations[id] === undefined)) {
                return id;
            }

            return Util.Localisation._translations[id];
        },

        // Traverses the DOM and translates relevant fields
        // See https://html.spec.whatwg.org/multipage/dom.html#attr-translate
        translateDOM: function () {
            function process(elem, enabled) {
                function isAnyOf(searchElement, items) {
                    return items.indexOf(searchElement) !== -1;
                }

                function translateAttribute(elem, attr) {
                    var str = elem.getAttribute(attr);
                    str = Util.Localisation.get(str);
                    elem.setAttribute(attr, str);
                }

                function translateTextNode(node) {
                    var str = node.data.trim();
                    str = Util.Localisation.get(str);
                    node.data = str;
                }

                if (elem.hasAttribute("translate")) {
                    if (isAnyOf(elem.getAttribute("translate"), ["", "yes"])) {
                        enabled = true;
                    } else if (isAnyOf(elem.getAttribute("translate"), ["no"])) {
                        enabled = false;
                    }
                }

                if (enabled) {
                    if (elem.hasAttribute("abbr") &&
                        elem.tagName === "TH") {
                        translateAttribute(elem, "abbr");
                    }
                    if (elem.hasAttribute("alt") &&
                        isAnyOf(elem.tagName, ["AREA", "IMG", "INPUT"])) {
                        translateAttribute(elem, "alt");
                    }
                    if (elem.hasAttribute("download") &&
                        isAnyOf(elem.tagName, ["A", "AREA"])) {
                        translateAttribute(elem, "download");
                    }
                    if (elem.hasAttribute("label") &&
                        isAnyOf(elem.tagName, ["MENUITEM", "MENU", "OPTGROUP",
                                       "OPTION", "TRACK"])) {
                        translateAttribute(elem, "label");
                    }
                    // FIXME: Should update "lang"
                    if (elem.hasAttribute("placeholder") &&
                        isAnyOf(elem.tagName in ["INPUT", "TEXTAREA"])) {
                        translateAttribute(elem, "placeholder");
                    }
                    if (elem.hasAttribute("title")) {
                        translateAttribute(elem, "title");
                    }
                    if (elem.hasAttribute("value") &&
                        elem.tagName === "INPUT" &&
                        isAnyOf(elem.getAttribute("type"), ["reset", "button"])) {
                        translateAttribute(elem, "value");
                    }
                }

                for (var i = 0;i < elem.childNodes.length;i++) {
                    var node = elem.childNodes[i];
                    if (node.nodeType === node.ELEMENT_NODE) {
                        process(node, enabled);
                    } else if (node.nodeType === node.TEXT_NODE && enabled) {
                        translateTextNode(node);
                    }
                }
            }

            process(document.body, true);
        },
    };

    return Util;
});
