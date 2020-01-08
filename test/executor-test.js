var expect = require("chai").expect;
var sinon = require("sinon");
var executor = require("../src/executor");
var stepRegistry = require("../src/step-registry");


describe("Executing steps", function () {
  var executeStepRequest = null;
  var executeStepFailingRequest = null;
  this.timeout(10000);

  before(function () {
    var opts = { continueOnFailure: false };
    stepRegistry.clear();
    stepRegistry.add("Say <hi> to <me>", function () { }, "executor-test.js", 3, opts);
    stepRegistry.add("failing test", function () { throw new Error("error message"); }, "executor-test.js", 6, opts);
    sinon.spy(stepRegistry, "get");
    global.gauge = {
      screenshotFn: function() {
        return Promise.resolve("screenshot");
      }
    };
    executeStepRequest = {
      actualStepText: "Say \"hello\" to \"gauge\"",
      parsedStepText: "Say {} to {}",
      parameters: [
        { parameterType: 1, value: "hello", name: "", table: null },
        { parameterType: 1, value: "gauge", name: "", table: null }
      ]
    };
    executeStepFailingRequest = {
      actualStepText: "failing test",
      parsedStepText: "failing test",
      parameters: []
    };
  });

  after(function (done) {
    stepRegistry.get.restore();
    done();
  });

  it("Should resolve promise when test function passes", function (done) {
    var promise = executor.step(executeStepRequest);
    promise.then(
      function (value) {
        expect(value.executionResult.failed).to.equal(false);
        done();
      }
    ).done();
  });

  it("Should reject the promise when test function fails", function (done) {
    var promise = executor.step(executeStepFailingRequest);
    promise.then(
      function () { },
      function (reason) {
        expect(reason.executionResult.failed).to.equal(true);
        expect(reason.executionResult.errorMessage).to.eql("Error: error message");
        expect(reason.executionResult.stackTrace).to.contains("executor-test.js");
        done();
      }
    ).done();
  });

});
