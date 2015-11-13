var assert = require('chai').assert;
var sinon  = require('sinon');
var StepExecutor = require('../lib/step-executor');

describe('Step Execution', function() {

  it('should call the function with specified parameters', function(done) {
    var fn = sinon.spy();
    var params = [1,2,3];
    StepExecutor.execute(fn, params);
    assert(fn.calledOnce);
    assert.deepEqual(params, fn.getCall(0).args);
    done();
  });

  it('should send done function as the last parameter', function(done) {
    var fn = sinon.spy();
    var params = [1,2];
    StepExecutor.execute(fn, params);
    var actualArgsLength = fn.getCall(0).args.length;
    assert.equal(3, actualArgsLength);
    done();
  });

  it('should return error response if function fails', function(done) {
    var error = new Error('Whoops!');
    var fn = function() {
      throw error;
    };

    var result = StepExecutor.execute(fn, []);
    assert.deepEqual({result: "failure", exception: error}, result);
    done();
  });

  it('should return success response if function succeeds', function() {
    var result = StepExecutor.execute(function() {}, []);
    assert.deepEqual({result: "success"}, result);
  });

});
