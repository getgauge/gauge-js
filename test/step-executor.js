var assert = require('chai').assert;
var sinon  = require('sinon');
var StepExecutor = require('../lib/step-executor');

describe('Step Execution', function() {
  var fn = sinon.spy();

  it('should call the function with specified parameters', function(done) {
    var params = [1,2,3];
    StepExecutor.execute(fn, params);
    assert(fn.calledOnce);
    assert.deepEqual(params, fn.getCall(0).args);
    done();
  });
});
