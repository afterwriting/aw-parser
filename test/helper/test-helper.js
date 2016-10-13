var fs = require('fs');
var chai = require('chai');

var testHelper = {};

testHelper.properties = ['text', 'type', 'line', 'start', 'end'];

testHelper.verifyTokenProperty = function(token, expectedToken, property, index, errorPrefix) {
    chai.assert.strictEqual(token[property], expectedToken[property], '[' + errorPrefix + '] #' + index + ' has incorrect ' + property + ', line: ' + token.line);
};

testHelper.verifyToken = function(token, expectedToken, index, errorPrefix) {
    this.properties.forEach(function(property) {
        this.verifyTokenProperty(token, expectedToken, property, index, errorPrefix);
    }, this);
};

testHelper.loadScriptAndTokens = function(scriptName, done) {
    fs.readFile('./test/data/' + scriptName + '.fountain', 'utf8', function(err, testFountain) {
        if (err) {
            throw new Error('Cannot read test data: ' + scriptName);
        }
        fs.readFile('./test/data/' + scriptName + '.tokens.json', 'utf8', function(err, testTokensJson) {
            if (err) {
                throw new Error('Cannot read expected tokens: ' + scriptName);
            }
            done(testFountain.toString(), JSON.parse(testTokensJson.toString()));
        });
    });
};

testHelper.getConfigWith = function(value) {
    return {
        print_headers: value,
        print_actions: value,
        print_dialogues: value,
        print_notes: value,
        print_sections: value,
        print_synopsis: value,
        each_scene_on_new_page: value,
        double_space_between_scenes: value,
        use_dual_dialogue: value
    }
};

testHelper.verifyTokenTypes = function(tokens, types) {
    var type;
    tokens.forEach(function(token, index) {
        type = types[index];
        this.verifyTokenProperty(token, {type: type}, 'type', index, 'Type of a token')
    }, this);
    chai.assert.lengthOf(tokens, types.length);
};

module.exports = testHelper;