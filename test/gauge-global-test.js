var assert = require('chai').assert;
var sinon  = require('sinon');
require('../gauge-global');

describe('Calling Step Registry', function() {

  before( function(done) {
    sinon.spy(stepRegistry, "add");
    done();
  });

  after( function(done) {
    stepRegistry.add.restore();
    done();
  });

  it('Should add test function to step registry', function(done) {
    sampleFunction = function() {};

    gauge('Step 1', sampleFunction);

    assert(stepRegistry.add.calledOnce);
    assert.equal('Step 1', stepRegistry.add.getCall(0).args[0]);
    assert.deepEqual(sampleFunction, stepRegistry.add.getCall(0).args[1]);
    done();
  });

});
