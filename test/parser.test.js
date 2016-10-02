var parser = require('../parser');
var testHelper = require('./helper/test-helper');
var chai = require('chai');

describe('Parser', function() {

    var script, config, result;

    it('Returns an empty result for an empty script', function() {
        result = parser.parse('', testHelper.getConfigWith(true));
        chai.assert.lengthOf(result.title_page, 0);
        chai.assert.lengthOf(result.tokens, 0);
    });

    it('Parsing types', function() {
        config = testHelper.getConfigWith(true);
        script = '#Section\n\n=Synopsis\n\nINT. HEADER 1\n\nAction\n\nHERO\n(Parenthetical)\nDialogue';
        result = parser.parse(script, config);

        testHelper.verifyTokenTypes(result.tokens, [
            'section', 'separator',
            'synopsis', 'separator',
            'scene_heading', 'separator',
            'action', 'separator',
            'character',
            'parenthetical',
            'dialogue'
        ]);

    });

    it('Ignores blank lines before first token', function() {
        script = '\n\n\n\n\nTitle:Title';
        result = parser.parse(script, config);

        chai.assert.strictEqual(result.title_page[0].text, 'Title');
    });

    describe('Formatting', function() {

        it('Page break', function() {
            script = 'Action\n\n===\n\nAction';
            result = parser.parse(script, config);
            testHelper.verifyTokenTypes(result.tokens, ['action', 'separator', 'page_break', 'separator', 'action']);
        });

        it('Centered', function() {
            script = '> centered <';
            result = parser.parse(script, config);
            testHelper.verifyTokenTypes(result.tokens, ['centered']);
        });

        it('Dual dialogue', function() {
            script = 'HERO\nHello!\n\nHERO 2 ^\nHello!\n';
            result = parser.parse(script, config);

            testHelper.verifyTokenTypes(result.tokens, ['character', 'dialogue', 'separator', 'character', 'dialogue']);
            chai.assert.strictEqual(result.tokens[0].dual, 'left');
            chai.assert.strictEqual(result.tokens[1].dual, 'left');
            chai.assert.strictEqual(result.tokens[3].text, 'HERO 2');
            chai.assert.strictEqual(result.tokens[3].dual, 'right');
            chai.assert.strictEqual(result.tokens[4].dual, 'right');
        });

        it('"^" when dual dialogue is disabled', function() {
            config.use_dual_dialogue = false;
            script = 'HERO\nHello!\n\nHERO 2 ^\nHello!\n';
            result = parser.parse(script, config);

            testHelper.verifyTokenTypes(result.tokens, ['character', 'dialogue', 'separator', 'character', 'dialogue']);
            chai.assert.strictEqual(result.tokens[3].text, 'HERO 2');
        });

        it('Scene numbers', function() {
            script = 'INT. SCENE #2#';
            result = parser.parse(script, config);
            chai.assert.strictEqual(result.tokens[1].number, '2');
            chai.assert.strictEqual(result.tokens[1].text, 'INT. SCENE');
            chai.assert.strictEqual(result.tokens[1].type, 'scene_heading');
        });

    });

    describe('Forced elements', function() {

        beforeEach(function() {
            config = testHelper.getConfigWith(true);
        });

        it('Non-breaking line in title tag', function() {

            script = 'Title:Line 1\n  \nLine 2';
            result = parser.parse(script, config);

            chai.assert.strictEqual(result.title_page[0].text, 'Line 1\n\nLine 2');
        });

        it('Non-breaking line in script tag', function() {

            script = 'HERO\nDialogue\n  \n...still in dialogue';
            result = parser.parse(script, config);

            testHelper.verifyTokenTypes(result.tokens, ['character', 'dialogue', 'dialogue', 'dialogue']);
            chai.assert.strictEqual(result.tokens[1].text, 'Dialogue');
            chai.assert.strictEqual(result.tokens[2].text, '');
            chai.assert.strictEqual(result.tokens[3].text, '...still in dialogue');
        });

        it('Forced scene heading', function() {
            script = '.HEADING';
            result = parser.parse(script, config);
            testHelper.verifyTokenTypes(result.tokens, ['scene_heading']);
        });

        it('Forced dialogue', function() {
            script = '@HERO\nDialogue';
            result = parser.parse(script, config);
            testHelper.verifyTokenTypes(result.tokens, ['character', 'dialogue']);
        });

        it('Forced action', function() {
            script = '!INT. ACTION';
            result = parser.parse(script, config);
            testHelper.verifyTokenTypes(result.tokens, ['action']);
        });

        it('Transition', function() {
            script = '>Cut to';
            result = parser.parse(script, config);
            testHelper.verifyTokenTypes(result.tokens, ['transition']);
        });

    });

    describe('Newline', function() {

        var crlf, cr, lf, config;

        beforeEach(function() {
            config = testHelper.getConfigWith(true);
            config.double_space_between_scenes = false;
            config.each_scene_on_new_page = false;
            crlf = 'INT. TEXT\r\n\r\nAction\r\n\r\nINT. TEXT\r\n\r\nAction';
            lf = 'INT. TEXT\r\rAction\r\rINT. TEXT\r\rAction';
            cr = 'INT. TEXT\n\nAction\n\nINT. TEXT\n\nAction';
        });

        it('Supports different new line types', function() {

            var crlfTokens = parser.parse(crlf, config).tokens,
                lfTokens = parser.parse(lf, config).tokens,
                crTokens = parser.parse(cr, config).tokens,
                tokens = ['scene_heading', 'separator', 'action', 'separator', 'scene_heading', 'separator', 'action'];

            testHelper.verifyTokenTypes(crlfTokens, tokens);
            testHelper.verifyTokenTypes(crTokens, tokens);
            testHelper.verifyTokenTypes(lfTokens, tokens);
        });

    });

    describe('Config', function() {

        beforeEach(function() {
            config = testHelper.getConfigWith(false);
        });

        it('Breaking a page before a header', function() {
            script = 'INT. HEADER 1\n\nAction\n\nINT. HEADER 2';
            config.print_headers = true;
            config.each_scene_on_new_page = true;
            result = parser.parse(script, config);

            testHelper.verifyTokenTypes(result.tokens, ['scene_heading', 'separator', 'page_break', 'scene_heading']);
        });

        it('Double space before headers', function() {
            script = 'INT. HEADER 1\n\nAction\n\nINT. HEADER 2';
            config.print_headers = true;
            config.double_space_between_scenes = true;
            result = parser.parse(script, config);

            testHelper.verifyTokenTypes(result.tokens, ['scene_heading', 'separator', 'separator', 'scene_heading']);
        });

        it('Ignoring types', function() {
            script = '#Section\n\n=Synopsis\n\nINT. HEADER 1\n\nAction\n\nHERO\nDialogue\n\nINT. HEADER 2';
            result = parser.parse(script, config);

            chai.assert.lengthOf(result.tokens, 0);
        });

        it('Skipping notes', function() {
            script = 'Test [[inline note]] test.';
            config.print_actions = true;
            result = parser.parse(script, config);

            chai.assert.strictEqual(result.tokens[0].text, 'Test test.');
        })
    });

});