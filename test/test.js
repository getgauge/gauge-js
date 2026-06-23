import Test from "../src/test.js";
import { expect } from "chai";
import sinon from "sinon";

describe("Test function execution", function () {

  it("should set async to true if passed in test has additional param", function () {
    const asyncTestFunction = function (param1, param2, done) {
      done(param1 + param2);
    };
    const syncTestFunction = function (param1, param2) {
      return param1 + param2;
    };
    const params = ["param1", "param2"];

    const asyncTest = new Test(asyncTestFunction, params);
    const syncTest = new Test(syncTestFunction, params);

    expect(asyncTest.async).to.equal(true);
    expect(syncTest.async).to.equal(false);
  });

  it("should call test function with params", function () {
    const testFunction = sinon.spy(function (arg1, arg2) {
      return arg1 + arg2;
    });
    const params = [1, 2];

    new Test(testFunction, params).run();

    expect(testFunction.calledWith(1, 2)).to.equal(true);
  });

  it("should pass the done function when additional param is present", function () {
    const testFunction = sinon.spy(function (arg1, arg2, done) {
      done();
    });
    const params = [1, 2];

    new Test(testFunction, params).run();

    expect(testFunction.getCall(0).args[2]).to.be.a("function");
  });

  it("should return a promise", function () {
    const result = new Test(function () { }, []).run();
    expect(result.then).to.be.a("function");
  });

  describe("when a test function fails", function () {
    it("should reject the promise", function (done) {
      const exception = new Error("Error!");
      const testFunction = sinon.stub().throws(exception);
      const result = new Test(testFunction, []).run();
      result.then(
        function () { },
        function (reason) {
          expect(reason.exception).to.equal(exception);
          expect(reason.duration).to.be.a("number");
          done();
        });
    });

    it("should reject the promise when if test function times out", function (done) {
      const asyncFn = function (gaugeDone) {
        return gaugeDone;
      };
      const result = new Test(asyncFn, []).run();
      result.then(
        function () { },
        function () {
          done();
        }
      );

    });

  });

  describe("when test function runs without any error", function () {
    it("should resolve the promise", function (done) {
      const result = new Test(function () { }, []).run();
      result.then(function (value) {
        expect(value.duration).to.be.a("number");
        done();
      });
    });
  });

  describe("when test function executes asynchronously", function () {
    it("should resolve the promise only when async execution finishes", function (done) {
      let asyncComplete = false;

      const testFunction = function (gaugeDone) {
        setTimeout(function () {
          asyncComplete = true;
          gaugeDone();
        }, 900);
      };

      const result = new Test(testFunction, []).run();

      result.then(function () {
        expect(asyncComplete).to.equal(true);
        done();
      });

    });
  });

  describe("when test fails stacktrace", function () {
    it("should not contain internal stack", function (done) {
      const testFunction = function () {
        throw new Error("failed");
      };

      const result = new Test(testFunction, []).run();

      result.then(function () { }).catch(function (reason) {
        expect(reason.exception.stack).to.not.contains("at Test.runFn");
        expect(reason.exception.stack.split("\n").length).to.be.eql(2);
        done();
      });
    });

    it("should contain relative path", function (done) {
      const testFunction = function () {
        throw new Error("failed");
      };
      const result = new Test(testFunction, []).run();
      result.then(function () { }).catch(function (reason) {
        expect(reason.exception.stack).to.not.contains(process.env.GAUGE_PROJECT_ROOT);
        done();
      });
    });
  });
});
