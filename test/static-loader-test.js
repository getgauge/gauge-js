var assert = require("chai").assert;
var loader = require("../src/static-loader");
var stepRegistry = require("../src/step-registry");

describe("Static loader", function () {
  beforeEach(function () {
    stepRegistry.clear();
  });

  it("Should load the steps from provided js contents", function (done) {
    var filepath = "step_implementation.js";
    var source = "step('vsdvsv', function () {\n" +
      "\tassert.equal(+number, numberOfVowels(word));\n" +
      "});";

    loader.reloadFile(filepath, source);
    var step = stepRegistry.get("vsdvsv");
    assert.isDefined(step);
    assert.isNull(step.fn);
    assert.deepEqual(step.fileLocations, [{ filePath: filepath, span: { start: 1, end: 3, startChar: 0, endChar: 2 } }]);
    assert.equal(step.stepText, "vsdvsv");
    assert.equal(step.generalisedText, "vsdvsv");
    assert.isNull(step.options);
    done();
  });

  it("Should load the aliases steps from provided js contents", function (done) {
    var filepath = "step_implementation.js";
    var source = "step(['vsdvsv', 'oohooo'], function () {\n" +
      "\tassert.equal(+number, numberOfVowels(word));\n" +
      "});";

    loader.reloadFile(filepath, source);
    var steps = stepRegistry.getStepTexts();
    assert.equal(steps.length, 2);
    assert.deepEqual(steps, ["vsdvsv", "oohooo"]);
    steps.forEach((stepText) => {
      var step = stepRegistry.get(stepText);
      assert.equal(step.hasAlias, true);
      assert.deepEqual(step.aliases, ["vsdvsv", "oohooo"]);
    });
    done();
  });

  it("Should reload the steps from for a given file and content", function (done) {
    var filepath = "step_implementation.js";

    var sourceV1 = "step('vsdvsv', function () {\n" +
      "\tconsole.log('it does not do anything')\n" +
      "});";

    var sourceV2 = "step('black magic', function () {\n" +
      "\tconsole.log('lets start the magic!');\n" +
      "});";

    loader.reloadFile(filepath, sourceV1);

    var step = stepRegistry.get("vsdvsv");
    assert.isDefined(step);

    loader.reloadFile(filepath, sourceV2);

    var oldStep = stepRegistry.get("vsdvsv");
    assert.isUndefined(oldStep);

    var newStep = stepRegistry.get("black magic");
    assert.isDefined(newStep);
    assert.isNull(newStep.fn);
    assert.deepEqual(newStep.fileLocations, [{ filePath: filepath, span: { start: 1, end: 3, startChar: 0, endChar: 2 } }]);
    assert.equal(newStep.stepText, "black magic");
    assert.equal(newStep.generalisedText, "black magic");
    assert.isNull(newStep.options);

    done();
  });

  it("Should not reload the steps if content has parse error", function (done) {
    var filepath = "step_implementation.js";

    var sourceV1 = "step('vsdvsv', function () {\n" +
      "\tconsole.log('it does not do anything')\n" +
      "});";

    var sourceV2 = "step('black magic', function () {\n" +
      "\tconsole.log('lets start the magic!');\n" +
      "\\ // syntax error\n" +
      "});";

    loader.reloadFile(filepath, sourceV1);

    var step = stepRegistry.get("vsdvsv");
    assert.isDefined(step);

    loader.reloadFile(filepath, sourceV2);

    var oldStep = stepRegistry.get("vsdvsv");
    assert.isDefined(oldStep);

    var newStep = stepRegistry.get("black magic");
    assert.isUndefined(newStep);
    done();
  });

  it("Should not add the steps with no value", function (done) {
    var filepath = "step_implementation.js";

    var source = "step('', function () {\n" +
      "\tconsole.log('it does not do anything')\n" +
      "});";

    loader.reloadFile(filepath, source);

    var steps = Object.keys(stepRegistry.registry);
    assert.isOk(steps.length == 0);
    done();
  });

  it("Should not add the step aliases with no value in", function (done) {
    var filepath = "step_implementation.js";

    var source = "step(['hello', ''], function () {\n" +
      "\tconsole.log('it does not do anything')\n" +
      "});";

    loader.reloadFile(filepath, source);

    var steps = Object.keys(stepRegistry.registry);
    assert.isOk(steps.length == 1);
    done();
  });
});
