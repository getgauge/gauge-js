var assert = require("chai").assert;
var stepRegistry = require("../src/step-registry");

describe("Store and retrieve steps", function () {
  var sampleFunction;

  beforeEach(function () {
    sampleFunction = function () { };
    stepRegistry.clear();
  });

  it("Should store and retrive steps", function (done) {
    stepRegistry.add("Sample Step {}", "Sample Step <1>", sampleFunction);
    assert.equal(sampleFunction, stepRegistry.get("Sample Step {}").fn);
    assert.equal("Sample Step {}", stepRegistry.get("Sample Step {}").generalisedText);
    assert.equal("Sample Step <1>", stepRegistry.get("Sample Step {}").stepText);
    done();
  });

  it("Should return true for implemented step", function (done) {
    stepRegistry.add("Say {} to {}", function () { });
    assert.equal(true, stepRegistry.exists("Say {} to {}"));
    done();
  });

  it("Should return false for unimplemented step", function (done) {
    assert.equal(false, stepRegistry.exists("Say {} to {}"));
    done();
  });

  it("Should clear registry", function (done) {
    stepRegistry.add("Sample Step {}", "Sample Step <1>", sampleFunction);
    stepRegistry.clear();
    assert.deepEqual({}, stepRegistry.get());
    done();
  });

  it("Should delete steps for given filepath", function (done) {
    var filepath = "impl.js";
    stepRegistry.add("Sample Step {}", "Sample Step <1>", sampleFunction, filepath, 2);
    stepRegistry.deleteSteps(filepath);
    assert.deepEqual({}, stepRegistry.get());
    done();
  });

  it("Should delete only fileLocation steps for duplicate steps", function (done) {
    var filepath = "impl.js";
    var anotherFilePath = "impl2.js";
    stepRegistry.add("Sample Step {}", "Sample Step <1>", sampleFunction, filepath, 2, {});
    stepRegistry.add("Sample Step {}", "Sample Step <1>", sampleFunction, anotherFilePath, 2, {});
    assert.equal(2, stepRegistry.get("Sample Step {}").count());

    stepRegistry.deleteSteps(filepath);
    var step = stepRegistry.get("Sample Step {}");
    assert.equal(1, step.count());
    assert.deepEqual({ filePath: anotherFilePath, line: 2 }, step.fileLocations[0]);
    done();
  });
});
