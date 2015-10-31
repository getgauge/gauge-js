var assert = require('chai').assert;
var sinon  = require('sinon');
require('../lib/gauge-global');

describe('Calling Step Registry', function() {

  before( function(done) {
    sinon.spy(stepRegistry, "add");
    sinon.spy(stepParser, "generalise");
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
    assert(stepParser.generalise.calledOnce);
    assert.equal('Step 1', stepRegistry.add.getCall(0).args[0]);
    assert.equal('Step 1', stepParser.generalise.getCall(0).args[0]);
    assert.deepEqual(sampleFunction, stepRegistry.add.getCall(0).args[1]);
    done();
  });

});
