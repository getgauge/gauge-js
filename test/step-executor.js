var assert = require('chai').assert;
var sinon  = require('sinon');
var StepExecutor = require('../lib/step-executor');

describe('Step Execution', function() {

  it('should pass the given parameters to the test function', function() {
    var fn = sinon.spy();
    var params = [1,2,3];
    StepExecutor.execute(fn, params, function() {});
    assert(fn.calledOnce);
    assert.deepEqual(params, fn.getCall(0).args);
  });

  describe('when additional argument is present', function() {
    it('should send done function as last parameter', function(done) {
      var fn = sinon.spy(function(arg1, arg2, gaugeDone) {});
      var params = [1,2];

      StepExecutor.execute(fn, params, function() {});

      var actualArgsLength = fn.getCall(0).args.length;
      assert.equal(3, actualArgsLength);
      done();
    });
  });

  describe('when additional argument is not present', function() {
    it('should not send done function', function(done) {
      var fn = sinon.spy(function(arg1, arg2) {});
      var params = [1,2];

      StepExecutor.execute(fn, params, function() {});

      var actualArgsLength = fn.getCall(0).args.length;
      assert.equal(2, actualArgsLength);
      done();
    });
  });

  describe('when test execution fails', function() {
    it('should call the callback', function(done) {
      var error = new Error('Whoops!');
      var fn = function() {
        throw error;
      };

      var result = StepExecutor.execute(fn, [], function(result) {
        assert.deepEqual({result: "failure", exception: error}, result);
        done();
      });
    });
  });

  describe('when test execution passes', function() {
    it('should call the callback', function(done) {
      var result = StepExecutor.execute(function() {}, [], function(result) {
        assert.deepEqual({result: "success"}, result);
        done();
      });
    });
  });

  describe('when async', function() {
    describe('test execution', function() {
      it('should call the callback only after the test function is finished', function(done) {
        var asyncComplete = false;
        var asyncFn = function(gaugeDone) {
          setTimeout(function(){ asyncComplete = true; gaugeDone(); }, 200);
        };
        StepExecutor.execute(asyncFn, [], function(result) {
          assert.equal(true, asyncComplete);
          done();
        });
      });

      it.only('should fail when test function times out', function(done) {
        var asyncFn = function(gaugeDone) {

        };

        StepExecutor.execute(asyncFn, [], function(result) {
          assert.equal("failure", result.result);
          done();
        });
      });
    })
  });

});
