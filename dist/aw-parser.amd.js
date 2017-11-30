(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["awParser"] = factory();
	else
		root["awParser"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

var operators = {};

var helpers = {
    operators: operators
};

operators.is = function() {
    var types = Array.prototype.slice.call(arguments);
    return types.indexOf(this.type) !== -1;
};

operators.is_dialogue = function() {
    return this.is("character", "parenthetical", "dialogue");
};

operators.name = function() {
    var character = this.text;
    var p = character.indexOf("(");
    if (p !== -1) {
        character = character.substring(0, p);
    }
    character = character.trim();
    return character;
};

operators.location = function() {
    var location = this.text.trim();
    location = location.replace(/^(INT\.?\/EXT\.?)|(I\/E)|(INT\.?)|(EXT\.?)/, "");
    var dash = location.lastIndexOf(" - ");
    if (dash !== -1) {
        location = location.substring(0, dash);
    }
    return location.trim();
};

operators.has_scene_time = function(time) {
    var suffix = this.text.substring(this.text.indexOf(" - "));
    return this.is("scene_heading") && suffix.indexOf(time) !== -1;
};

operators.location_type = function() {
    var location = this.text.trim();
    if (/^I(NT.?)?\/E(XT.?)?/.test(location)) {
        return "mixed";
    }
    else if (/^INT.?/.test(location)) {
        return "int";
    }
    else if (/^EXT.?/.test(location)) {
        return "ext";
    }
    return "other";
};

var enrich_token = function(token) {
    for (var name in operators) {
        token[name] = operators[name];
    }
    return token;
};

var create_token_delegator = function(line, name) {
    return function() {
        return line.token ? line.token[name].apply(line.token, arguments) : null;
    };
};

var create_fquery_delegator = function(name) {
    return function() {
        var args = arguments;
        return function(item) {
            return item[name].apply(item, args);
        };
    };
};

helpers.fq = {};
for (var name in operators) {
    helpers.fq[name] = create_fquery_delegator(name);
}

var enrich_line = function(line) {
    for (var name in operators) {
        line[name] = create_token_delegator(line, name);
    }
    return line;
};

helpers.first_text = function(type, list, default_value) {
    for (var i = 0; i < list.length; i++) {
        if (list[i].type === type) {
            return list[i].text;
        }
    }
    return default_value;
};

helpers.create_line = function(line) {
    line.text = line.text || "";
    line.type = line.type || "unknown";
    line.start = line.start || 0;
    line.end = line.end || 0;
    line.token = line.token || helpers.create_token({
        type: line.type
    });
    line.token.lines = line.token.lines || [line];
    return enrich_line(line);
};

helpers.create_token = function(token) {
    token.text = token.text || "";
    token.type = token.type || "unknown";
    token.start = token.start || 0;
    token.end = token.end || 0;
    token.lines = token.lines || [];
    return enrich_token(token);
};

helpers.create_separator = function(start, end) {
    return helpers.create_token({
        text: "",
        start: start,
        end: end,
        lines: [""],
        type: "separator"
    });
};

module.exports = helpers;



/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var parser = __webpack_require__(2),
    helpers = __webpack_require__(0);

module.exports = {
    parser: parser,
    helpers: helpers
};

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

var h = __webpack_require__(0);

var parser = {};

var regex = {
    title_page: /(title|credit|author[s]?|source|notes|draft date|date|contact|copyright)\:.*/i,

    section: /^(#+)(?: *)(.*)/,
    synopsis: /^(?:\=(?!\=+) *)(.*)/,

    scene_heading: /^((?:\*{0,3}_?)?(?:(?:int|ext|est|int\/ext|i\.?\/e\.?)[. ]).+)|^(?:\.(?!\.+))(.+)/i,
    scene_number: /#(.+)#/,

    transition: /^((?:FADE (?:TO BLACK|OUT)|CUT TO BLACK)\.|.+ TO\:|^TO\:$)|^(?:> *)(.+)/,

    dialogue: /^([A-Z*_]+[0-9A-Z (._\-')]*)(\^?)?(?:\n(?!\n+))([\s\S]+)/,
    character: /^([A-Z*_]+[0-9A-Z (._\-')]*)\^?$|^@.*$/,
    parenthetical: /^(\(.+\))$/,

    action: /^(.+)/g,
    centered: /^(?:> *)(.+)(?: *<)(\n.+)*/g,

    page_break: /^\={3,}$/,
    line_break: /^ {2}$/
};

parser.parse = function(original_script, cfg) {

    var script = original_script,
        result = {
            title_page: [],
            tokens: []
        };
    if (!script) {
        return result;
    }

    var new_line_length = script.match(/\r\n/) ? 2 : 1;

    if (!cfg.print_notes) {
        script = script.replace(/ {0,1}\[\[/g, " /*").replace(/\]\] {0,1}/g, "*/");
    }

    var lines = script.split(/\r\n|\r|\n/);

    var create_token = function(text, cursor, line) {
        return h.create_token({
            text: text.trim(),
            start: cursor,
            end: cursor + text.length - 1 + new_line_length,
            line: line
        });
    };

    var lines_length = lines.length,
        current = 0,
        scene_number = 1,
        match, text, last_title_page_token,
        token, last_was_separator = false,
        top_or_separated = false,
        token_category = "none",
        last_character_index,
        dual_right,
        state = "normal",
        cache_state_for_comment,
        nested_comments = 0,
        title_page_started = false;


    var reduce_comment = function(prev, current) {
        if (current === "/*") {
            nested_comments++;
        } else if (current === "*/") {
            nested_comments--;
        } else if (!nested_comments) {
            prev = prev + current;
        }
        return prev;
    };

    var if_not_empty = function(a) {
        return a;
    };

    for (var i = 0; i < lines_length; i++) {
        text = lines[i];

        // replace inline comments
        text = text.split(/(\/\*){1}|(\*\/){1}|([^\/\*]+)/g).filter(if_not_empty).reduce(reduce_comment, "");

        if (nested_comments && state !== "ignore") {
            cache_state_for_comment = state;
            state = "ignore";
        } else if (state === "ignore") {
            state = cache_state_for_comment;
        }

        if (nested_comments === 0 && state === "ignore") {
            state = cache_state_for_comment;
        }


        token = create_token(text, current, i);
        current = token.end + 1;

 
        if (text.trim().length === 0 && text !== "  ") {
            var skip_separator = cfg.merge_multiple_empty_lines && last_was_separator;

            state = "normal";

            if (skip_separator || state === "title_page") {
                continue;
            }

            dual_right = false;
            token.type = "separator";
            last_was_separator = true;
            result.tokens.push(token);
            continue;
        }

        top_or_separated = last_was_separator || i === 0;
        token_category = "script";

        if (!title_page_started && regex.title_page.test(token.text)) {
            state = "title_page";
        }

        if (state === "title_page") {
            if (regex.title_page.test(token.text)) {
                var index = token.text.indexOf(":");
                token.type = token.text.substr(0, index).toLowerCase();
                token.text = token.text.substr(index + 1);
                last_title_page_token = token;
                result.title_page.push(token);
                title_page_started = true;
                continue;
            } else if (title_page_started) {
                last_title_page_token.text += (last_title_page_token.text ? "\n" : "") + token.text;
                continue;
            }
        }

        if (state === "normal") {
            if (token.text.match(regex.line_break)) {
                token_category = "none";
            } else if (token.text.match(regex.centered)) {
                token.type = "centered";
                token.text = token.text.replace(/>|</g, "").trim();
            } else if (token.text.match(regex.transition)) {
                token.text = token.text.replace(/> ?/, "");
                token.type = "transition";
            } else if (match = token.text.match(regex.synopsis)) {
                token.text = match[1];
                token.type = token.text ? "synopsis" : "separator";
            } else if (match = token.text.match(regex.section)) {
                token.level = match[1].length;
                token.text = match[2];
                token.type = "section";
            } else if (token.text.match(regex.scene_heading)) {
                token.text = token.text.replace(/^\./, "");
                if (cfg.each_scene_on_new_page && scene_number !== 1) {
                    var page_break = h.create_token({
                        type: "page_break",
                        start: token.start,
                        end: token.end
                    });
                    result.tokens.push(page_break);
                }

                token.type = "scene_heading";
                token.number = scene_number;
                if (match = token.text.match(regex.scene_number)) {
                    token.text = token.text.replace(regex.scene_number, "");
                    token.number = match[1];
                }
                scene_number++;
            } else if (token.text.match(regex.page_break)) {
                token.text = "";
                token.type = "page_break";
            } else if (token.text.length && token.text[0] === "!") {
                token.type = "action";
                token.text = token.text.substr(1);
            } else if ((token.text.length > 0 && token.text[0] === "@") || (token.text === token.text.toUpperCase() && top_or_separated)) {
                if (i === lines_length || i === lines_length - 1 || lines[i + 1].trim().length === 0) {
                    token.type = "shot";
                } else {
                    state = "dialogue";
                    token.type = "character";
                    token.text = token.text.replace(/^@/, "");
                    if (token.text[token.text.length - 1] === "^") {
                        if (cfg.use_dual_dialogue) {
                            // update last dialogue to be dual:left
                            var dialogue_tokens = ["dialogue", "character", "parenthetical"];
                            while (dialogue_tokens.indexOf(result.tokens[last_character_index].type) !== -1) {
                                result.tokens[last_character_index].dual = "left";
                                last_character_index++;
                            }
                            token.dual = "right";
                            dual_right = true;
                        }
                        token.text = token.text.replace("^", "");
                    }
                    last_character_index = result.tokens.length;
                }
            }
            else {
                token.type = "action";
            }
        } else {
            if (token.text.match(regex.parenthetical)) {
                token.type = "parenthetical";
            } else {
                token.type = "dialogue";
            }
            if (dual_right) {
                token.dual = "right";
            }
        }

        last_was_separator = false;

        if (token_category === "script" && state !== "ignore") {
            if (token.is("scene_heading", "transition")) {
                token.text = token.text.toUpperCase();
                title_page_started = true; // ignore title tags after first heading
            }
            if (token.text && token.text[0] === "~") {
                token.text = "*" + token.text.substr(1) + "*";
            }
            token.text = token.text.trim();
            result.tokens.push(token);
        }

    }

    var current_index = 0, previous_type = null;
    // tidy up separators
    while (current_index < result.tokens.length) {
        var current_token = result.tokens[current_index];

        if (
            (!cfg.print_actions && current_token.is("action", "transition", "centered", "shot")) ||
            (!cfg.print_notes && current_token.type === "note") ||
            (!cfg.print_headers && current_token.type === "scene_heading") ||
            (!cfg.print_sections && current_token.type === "section") ||
            (!cfg.print_synopsis && current_token.type === "synopsis") ||
            (!cfg.print_dialogues && current_token.is_dialogue()) ||
            (cfg.merge_multiple_empty_lines && current_token.is("separator") && previous_type === "separator")) {

            result.tokens.splice(current_index, 1);
            continue;
        }

        if (cfg.double_space_between_scenes && current_token.is("scene_heading") && current_token.number !== 1) {
            var additional_separator = h.create_separator(token.start, token.end);
            result.tokens.splice(current_index, 0, additional_separator);
            current_index++;
        }
        previous_type = current_token.type;
        current_index++;
    }

    // clean separators at the end
    while (result.tokens.length > 0 && result.tokens[result.tokens.length - 1].type === "separator") {
        result.tokens.pop();
    }

    return result;
};

module.exports = parser;

/***/ })
/******/ ]);
});