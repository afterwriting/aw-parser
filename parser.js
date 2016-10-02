var h = require('./helpers');

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

var parser = {
  _nested_comments : 0,
  _scene_number : 1,
  _title_page_started : false,
  _last_title_page_token : false,
  _last_character_index : false,
  _token_category : 'none',
  _state : 'normal',
  _dual_right : null,
  _result : {
      title_page: [],
      tokens: []
  }
};

function create_token(text, cursor, line, new_line_length) {
    return h.create_token({
        text: text.trim(),
        start: cursor,
        end: cursor + text.length - 1 + new_line_length,
        line: line
    });
}

function if_not_empty(a) {
    return a;
}

parser._continueLoop = function(cfg, current_token, previous_type) {
    return (
            (!cfg.print_actions && current_token.is("action", "transition", "centered", "shot")) ||
            (!cfg.print_notes && current_token.type === "note") ||
            (!cfg.print_headers && current_token.type === "scene_heading") ||
            (!cfg.print_sections && current_token.type === "section") ||
            (!cfg.print_synopsis && current_token.type === "synopsis") ||
            (!cfg.print_dialogues && current_token.is_dialogue()) ||
            (current_token.is('separator') && previous_type === 'separator')
           )
}

parser._reduce_comment = function(prev, current) {
    switch (current) {
        case '/*':
            this._nested_comments++;
            break;
        case '*/':
            this._nested_comments--;
            break;
        default :
            if (!this._nested_comments) {
                prev = prev + current;
            }
    }
    return prev;
}

parser._treatScriptToken = function (token) {
    if (token.is('scene_heading', 'transition')) {
        token.text = token.text.toUpperCase();
        this._title_page_started = true; // ignore title tags after first heading
    }
    if (token.text && token.text[0] === '~') {
        token.text = '*' + token.text.substr(1) + '*';
    }
    token.text = token.text.trim();
    this._result.tokens.push(token);
}

parser._threatTitleStateToken = function (token) {
  var index = token.text.indexOf(':');
  token.type = token.text.substr(0, index).toLowerCase();
  token.text = token.text.substr(index + 1);
  this._last_title_page_token = token;
  this._title_page_started = true;
  this._result.title_page.push(token);
  return token
}

parser._treatNormalStateToken = function (token, cfg, lines_length, lines, i) {
    var match = null;

    if (token.text.match(regex.line_break)) {
        this._token_category = 'none';
    } else if (token.text.match(regex.centered)) {
        token.type = 'centered';
        token.text = token.text.replace(/>|</g, '').trim();
    } else if (token.text.match(regex.transition)) {
        token.text = token.text.replace(/> ?/, '');
        token.type = 'transition';
    } else if (match = token.text.match(regex.synopsis)) {
        token.text = match[1];
        token.type = token.text ? 'synopsis' : 'separator';
    } else if (match = token.text.match(regex.section)) {
        token.level = match[1].length;
        token.text = match[2];
        token.type = 'section';
    } else if (token.text.match(regex.scene_heading)) {
        token.text = token.text.replace(/^\./, '');
        if (cfg.each_scene_on_new_page && this._scene_number !== 1) {
            var page_break = h.create_token({
                type: 'page_break',
                start: token.start,
                end: token.end
            });
            this._result.tokens.push(page_break);
        }

        token.type = 'scene_heading';
        token.number = this._scene_number;
        if (match = token.text.match(regex.scene_number)) {
            token.text = token.text.replace(regex.scene_number, '');
            token.number = match[1];
        }
        this._scene_number++;
    } else if (token.text.match(regex.page_break)) {
        token.text = '';
        token.type = 'page_break';
    } else if (token.text.length && token.text[0] === '!') {
        token.type = 'action';
        token.text = token.text.substr(1);
    } else if ((token.text.length > 0 && token.text[0] === '@') || token.text === token.text.toUpperCase()) {
        if (i === lines_length || i === lines_length - 1 || lines[i + 1].trim().length === 0) {
            token.type = 'shot';
        } else {
            this._state = 'dialogue';
            token.type = 'character';
            token.text = token.text.replace(/^@/, '');
            if (token.text[token.text.length - 1] === '^') {
                if (cfg.use_dual_dialogue) {
                    // update last dialogue to be dual:left
                    var dialogue_tokens = ['dialogue', 'character', 'parenthetical'];
                    while (dialogue_tokens.indexOf(this._result.tokens[this._last_character_index].type) !== -1) {
                        this._result.tokens[this._last_character_index].dual = 'left';
                        this._last_character_index++;
                    }
                    token.dual = 'right';
                    this._dual_right = true;
                }
                token.text = token.text.replace('^', '');
            }
            this._last_character_index = this._result.tokens.length;
        }
    }
    else {
        token.type = 'action';
    }

    return token;
}

parser.parse = function(original_script, cfg) {

    var script = original_script;
    if (!script) {
        return this._result;
    }

    var new_line_length = script.match(/\r\n/) ? 2 : 1;

    if (!cfg.print_notes) {
        script = script.replace(/ {0,1}\[\[/g, ' /*').replace(/\]\] {0,1}/g, '*/');
    }

    var lines = script.split(/\r\n|\r|\n/),
        lines_length = lines.length,
        current = 0,
        text,
        token, last_was_separator = false,
        cache_state_for_comment;

    for (var i = 0; i < lines_length; i++) {
        text = lines[i];
        // replace inline comments
        text = text.split(/(\/\*){1}|(\*\/){1}|([^\/\*]+)/g).filter(if_not_empty).reduce(this._reduce_comment, '');

        if (this._nested_comments && this._state !== 'ignore') {
            cache_state_for_comment = this._state;
            this._state = 'ignore';
        } else if (this._state === 'ignore') {
            this._state = cache_state_for_comment;
        }

        if (this._nested_comments === 0 && this._state === 'ignore') {
            this._state = cache_state_for_comment;
        }

        token = create_token(text, current, i, new_line_length);
        current = token.end + 1;

        if (text.trim().length === 0 && text !== "  ") {
            if (!last_was_separator) {
                this._state = 'normal';
                this._dual_right = false;
                token.type = 'separator';
                last_was_separator = true;
                this._result.tokens.push(token);
                continue;
            } else {
                // ignore blank separators
                if (this._title_page_started) {
                    this._state = 'normal';
                }
                continue;
            }
        }

        this._token_category = 'script';

        if (!this._title_page_started && regex.title_page.test(token.text)) {
            this._state = 'title_page';
        }

        if (this._state === 'title_page') {
            if (regex.title_page.test(token.text)) {
                this._threatTitleStateToken(token)
                continue;
            } else if (this._title_page_started) {
                this._last_title_page_token.text += (this._last_title_page_token.text ? "\n" : "") + token.text;
                continue;
            }
        }

        if (this._state === 'normal') {
            token = this._treatNormalStateToken(token, cfg, lines_length, lines, i);
        } else {
            if (token.text.match(regex.parenthetical)) {
                token.type = 'parenthetical';
            } else {
                token.type = 'dialogue';
            }
            if (this._dual_right) {
                token.dual = 'right';
            }
        }

        last_was_separator = false;

        if (this._token_category === 'script' && this._state !== 'ignore') {
            this._treatScriptToken(token);
        }
    }

    var current_index = 0, previous_type = null;
    // tidy up sepataors
    while (current_index < this._result.tokens.length) {
        var current_token = this._result.tokens[current_index];

        if (this._continueLoop(cfg, current_token, previous_type)) {
            this._result.tokens.splice(current_index, 1);
            continue;
        }

        if (cfg.double_space_between_scenes && current_token.is('scene_heading') && current_token.number !== 1) {
            var additional_separator = h.create_separator(token.start, token.end);
            this._result.tokens.splice(current_index, 0, additional_separator);
            current_index++;
        }
        previous_type = current_token.type;
        current_index++;
    }

    // clean separators at the end
    while (this._result.tokens.length > 0 && this._result.tokens[this._result.tokens.length - 1].type === 'separator') {
        this._result.tokens.pop();
    }

    return this._result;
};


module.exports = parser;
