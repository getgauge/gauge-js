var assert = require('chai').assert;
var stepParser = require('../step-parser');

describe('Parsing steps', function() {

  it('Should generalise a step.', function(done) {
    assert.equal('Say {} to {}', stepParser.generalise('Say <greeting> to <user>'));
    assert.equal('A step without any paramaeters', stepParser.generalise('A step without any paramaeters'));
    done();
  });

});
