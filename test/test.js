var Test = require('../src/test');
var expect = require('chai').expect;
var sinon  = require('sinon');

describe.only('Test function execution', function() {

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
      var testFunction = sinon.stub().throws();
      var result = new Test(testFunction, []).run();
      result.then(function() {}, function(reason) { done(); }).done();
    });
  });

  describe('when test function runs without any error', function() {
    it('should resolve the promise', function(done) {
      var result = new Test(function() {}, []).run();
      result.then(function(value) { done(); });
    });
  });

});
