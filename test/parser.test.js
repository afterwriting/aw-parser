var parser = require('../parser');
var testHelper = require('./helper/test-helper');
var chai = require('chai');

describe('Parser', function() {

    var script, config, result;

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

    });

    describe('Forced elements' , function() {

        beforeEach(function() {
            config = testHelper.getConfigWith(true);
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