var assert = require("chai").assert;
var StepRegistry = require("../src/step-registry");

describe("Store and retrieve steps", function() {
  var sampleFunction,
      stepRegistry;

  beforeEach(function () {
    sampleFunction = function() {};
    stepRegistry = new StepRegistry();
  });

  it("Should store and retrive steps", function(done) {
    stepRegistry.add("Sample Step {}", "Sample Step <1>", sampleFunction);
    assert.equal(sampleFunction, stepRegistry.get("Sample Step {}").fn);
    assert.equal("Sample Step {}", stepRegistry.get("Sample Step {}").generalisedText);
    assert.equal("Sample Step <1>", stepRegistry.get("Sample Step {}").stepText);
    done();
  });

  it("Should return true for implemented step", function(done) {
    stepRegistry.add("Say {} to {}", function(){});
    assert.equal(true, stepRegistry.exists("Say {} to {}"));
    done();
  });

  it("Should return false for unimplemented step", function(done) {
    assert.equal(false, stepRegistry.exists("Say {} to {}"));
    done();
  });

});
