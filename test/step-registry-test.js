import { assert } from "chai";
import stepRegistry from "../src/step-registry.js";

describe("Store and retrieve steps", function () {
  var sampleFunction;

  beforeEach(function () {
    sampleFunction = function () { };
    stepRegistry.clear();
  });

  it("Should store and retrive steps", function (done) {
    stepRegistry.add("Sample Step <1>", sampleFunction);
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
    stepRegistry.add("Sample Step <1>", sampleFunction);
    stepRegistry.clear();
    assert.deepEqual({}, stepRegistry.registry);
    done();
  });

  it("Should delete steps for given filepath", function (done) {
    var filepath = "impl.js";
    stepRegistry.add("Sample Step <1>", sampleFunction, filepath, 2);
    stepRegistry.deleteSteps(filepath);
    assert.deepEqual({}, stepRegistry.registry);
    done();
  });

  it("Should delete only fileLocation steps for duplicate steps", function (done) {
    var filepath = "impl.js";
    var anotherFilePath = "impl2.js";
    stepRegistry.add("Sample Step <1>", sampleFunction, filepath, { start: 2, end: 4 }, {});
    stepRegistry.add("Sample Step <1>", sampleFunction, anotherFilePath, { start: 2, end: 4 }, {});
    assert.equal(2, stepRegistry.get("Sample Step {}").count());

    stepRegistry.deleteSteps(filepath);
    var step = stepRegistry.get("Sample Step {}");
    assert.equal(1, step.count());
    assert.deepEqual({ filePath: anotherFilePath, span: { start: 2, end: 4 } }, step.fileLocations[0]);
    done();
  });

  it("Should add steps with aliases", function (done) {
    stepRegistry.addAlias(["Sample Step <1>", "Sample alias step <1>"], sampleFunction);

    assert.equal(sampleFunction, stepRegistry.get("Sample Step {}").fn);
    assert.equal(stepRegistry.get("Sample Step {}").generalisedText, "Sample Step {}");
    assert.equal(stepRegistry.get("Sample Step {}").stepText, "Sample Step <1>");
    assert.equal(stepRegistry.get("Sample Step {}").hasAlias, true);
    assert.deepEqual(stepRegistry.get("Sample Step {}").aliases, ["Sample Step <1>", "Sample alias step <1>"]);

    assert.equal(sampleFunction, stepRegistry.get("Sample alias step {}").fn);
    assert.equal(stepRegistry.get("Sample alias step {}").generalisedText, "Sample alias step {}");
    assert.equal(stepRegistry.get("Sample alias step {}").stepText, "Sample alias step <1>");
    assert.equal(stepRegistry.get("Sample alias step {}").hasAlias, true);
    assert.deepEqual(stepRegistry.get("Sample alias step {}").aliases, ["Sample Step <1>", "Sample alias step <1>"]);

    done();
  });

  it("Should check if given filepath is already cached", function (done) {
    var filepath = "impl.js";
    stepRegistry.add("Sample Step <1>", sampleFunction, filepath, 2);
    assert.isTrue(stepRegistry.isFileCached(filepath));
    assert.isNotTrue(stepRegistry.isFileCached("some_impl.js"));
    done();
  });
});
