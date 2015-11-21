var Test = require('../src/test');
var expect = require('chai').expect;
var sinon  = require('sinon');

describe('Test function execution', function() {

  it('should set async to true if passed in test has additional param', function() {
    var asyncTestFunction = function(param1, param2, done) {};
    var syncTestFunction = function(param1, param2){};
    var params = ['param1', 'param2'];

    var asyncTest = new Test(asyncTestFunction, params);
    var syncTest = new Test(syncTestFunction, params);

    expect(asyncTest.async).to.equal(true);
    expect(syncTest.async).to.equal(false);
  });

  it('should call test function with params', function() {
    var testFunction = sinon.spy(function(arg1, arg2) {});
    var params = [1,2];

    new Test(testFunction, params).run();

    expect(testFunction.calledWith(1,2)).to.equal(true);
  });

  it('should pass the done function when additional param is present', function() {
    var testFunction = sinon.spy(function(arg1, arg2, done) {});
    var params = [1, 2];

    new Test(testFunction, params).run();

    expect(testFunction.getCall(0).args[2]).to.be.a('function');
  });

  it('should return a promise', function() {
    var result = new Test(function() {}, []).run();
    expect(result.then).to.be.a('function');
  });

  describe('when a test function fails', function() {
    it('should reject the promise', function(done) {
      var exception = new Error('Error!');
      var testFunction = sinon.stub().throws(exception);
      var result = new Test(testFunction, []).run();
      result.then(
        function() {},
        function(reason) {
          expect(reason.exception).to.equal(exception);
          expect(reason.duration).to.be.a('number');
          done();
        }).done();
    });

    it('should reject the promise when if test function times out', function(done) {
      var asyncFn = function(gaugeDone) {

      };
      var result = new Test(asyncFn, []).run();
      result.then(
        function() {},
        function(reason) {
          done();
        }
      ).done();

    });

  });

  describe('when test function runs without any error', function() {
    it('should resolve the promise', function(done) {
      var result = new Test(function() {}, []).run();
      result.then(function(value) {
        expect(value.duration).to.be.a('number');
        done();
      }).done();
    });
  });

  describe('when test function executes asynchronously', function() {
    it('should resolve the promise only when async execution finishes', function(done) {
      var asyncComplete = false;

      var testFunction = function(gaugeDone) {
        setTimeout(function () {
          asyncComplete = true;
          gaugeDone();
        }, 900);
      };

      var result = new Test(testFunction, []).run();

      result.then(function() {
        expect(asyncComplete).to.equal(true);
        done();
      }).done();

    });
  });

});
