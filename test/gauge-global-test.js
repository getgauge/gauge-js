var assert = require("chai").assert;
var sinon  = require("sinon");
var stepRegistry = require("../src/step-registry");
var stepParser = require("../src/step-parser");
var { step, gauge } = require("../src/gauge-global");
var customScreenshotRegistry = require("../src/custom-screenshot-registry");

describe("Calling global gauge.step()", function() {
  beforeEach(function() {
    stepRegistry.clear();
  });

  it("should throw error if steptext is empty", function (done) {
    var dumb = function () {};
    assert.throw(function () { step(); });
    assert.throw(function () { step("", dumb); });
    assert.throw(function () { step([], dumb); });
    assert.throw(function () { step(["", ""], dumb); });
    done();
  });

  it("should add test function to step registry", function(done) {
    sinon.spy(stepRegistry, "add");
    sinon.spy(stepParser, "generalise");

    var sampleFunction = function() {};

    step("Step <1>", sampleFunction);

    assert(stepRegistry.add.calledOnce);
    assert(stepParser.generalise.calledOnce);
    assert.equal("Step <1>", stepParser.generalise.getCall(0).args[0]);
    assert.equal("Step <1>", stepRegistry.add.getCall(0).args[0]);
    assert.deepEqual(sampleFunction, stepRegistry.add.getCall(0).args[1]);

    stepRegistry.add.restore();
    stepParser.generalise.restore();
    done();
  });

  it("should support step aliases", function(done) {
    var sampleFunction = function(stepnum) { console.log(stepnum); };
    sinon.spy(stepRegistry, "addAlias");

    step(["Step <stepnum>","Another step <stepnum>"], sampleFunction);

    assert(stepRegistry.addAlias.calledOnce);

    var list = stepRegistry.registry;

    assert(list["Step {}"]);
    assert(list["Another step {}"]);

    assert.equal(list["Step {}"].stepText, "Step <stepnum>");
    assert.equal(list["Step {}"].hasAlias, true);
    assert.deepEqual(list["Step {}"].aliases, ["Step <stepnum>", "Another step <stepnum>"]);
    assert.deepEqual(list["Step {}"].fn, sampleFunction);

    assert.equal(list["Another step {}"].stepText, "Another step <stepnum>");
    assert.equal(list["Another step {}"].hasAlias, true);
    assert.deepEqual(list["Another step {}"].aliases, ["Step <stepnum>", "Another step <stepnum>"]);
    assert.deepEqual(list["Another step {}"].fn, sampleFunction);

    stepRegistry.addAlias.restore();
    done();
  });

});

describe("Calling global gauge.screenshot()", function() {
  sinon.spy(customScreenshotRegistry, "add");
  beforeEach(function() {
    customScreenshotRegistry.add.resetHistory();
  });

  it("should pass arguments to capture", () => {
    gauge.screenshot(1, 2, 3);
    assert(customScreenshotRegistry.add
      .getCall(0)
      .calledWithExactly(1, 2, 3)
    , "passed correct arguments");
  });
});
