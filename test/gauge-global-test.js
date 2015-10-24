var assert = require('chai').assert
require('../gauge-global');

describe('Calling Step Registry', function() {
  it('Should add test function to step registry', function() {
    sampleFunction = function() {};
    gauge('Step 1', sampleFunction);
    assert.equal(sampleFunction, stepRegistry.get('Step 1'));
  });
});
