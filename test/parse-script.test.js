var fs = require('fs');
var chai = require('chai');
var testHelper = require('./helper/test-helper');
var parser = require('../parser');

describe('Parsing sample files', function() {

    var result = {}, expectedResult;

    beforeEach(function(done) {
        var config = testHelper.getConfigWith(true);
        config.each_scene_on_new_page = false;
        testHelper.loadScriptAndTokens('sample', function(script, expected) {
            result = parser.parse(script, config);
            expectedResult = expected;
            done();
        });
    });

    it('Generates correct number of tokens', function() {
        chai.assert.lengthOf(result.title_page, expectedResult.title_page.length);
        chai.assert.lengthOf(result.tokens, expectedResult.tokens.length);
    });

    it('Generates correct title page tokens', function() {
        var expectedTitlePage = expectedResult.title_page;
        result.title_page.forEach(function(token, index) {
            testHelper.verifyToken(token, expectedTitlePage[index], index, 'Title Page Token');
        });
    });

    it('Generate correct page tokens', function() {
        var expectedTitlePage = expectedResult.tokens;
        result.tokens.forEach(function(token, index) {
            testHelper.verifyToken(token, expectedTitlePage[index], index, 'Script Page Token');
        });
    });

});