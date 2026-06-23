import { assert } from "chai";
import loader from "../src/static-loader.js";
import stepRegistry from "../src/step-registry.js";

describe("Static loader", function () {
  beforeEach(function () {
    stepRegistry.clear();
  });

  it("Should load the steps from provided js contents", function (done) {
    const filepath = "step_implementation.js";
    const source = "step('vsdvsv', function () {\n" +
      "\tassert.equal(+number, numberOfVowels(word));\n" +
      "});";

    loader.reloadFile(filepath, source);
    const step = stepRegistry.get("vsdvsv");
    assert.isDefined(step);
    assert.isNull(step.fn);
    assert.deepEqual(step.fileLocations, [{ filePath: filepath, span: { start: 1, end: 3, startChar: 0, endChar: 2 } }]);
    assert.equal(step.stepText, "vsdvsv");
    assert.equal(step.generalisedText, "vsdvsv");
    assert.isNull(step.options);
    done();
  });

  it("Should load the aliases steps from provided js contents", function (done) {
    const filepath = "step_implementation.js";
    const source = "step(['vsdvsv', 'oohooo'], function () {\n" +
      "\tassert.equal(+number, numberOfVowels(word));\n" +
      "});";

    loader.reloadFile(filepath, source);
    const steps = stepRegistry.getStepTexts();
    assert.equal(steps.length, 2);
    assert.deepEqual(steps, ["vsdvsv", "oohooo"]);
    steps.forEach((stepText) => {
      const step = stepRegistry.get(stepText);
      assert.equal(step.hasAlias, true);
      assert.deepEqual(step.aliases, ["vsdvsv", "oohooo"]);
    });
    done();
  });

  it("Should reload the steps from for a given file and content", function (done) {
    const filepath = "step_implementation.js";

    const sourceV1 = "step('vsdvsv', function () {\n" +
      "\tconsole.log('it does not do anything')\n" +
      "});";

    const sourceV2 = "step('black magic', function () {\n" +
      "\tconsole.log('lets start the magic!');\n" +
      "});";

    loader.reloadFile(filepath, sourceV1);

    const step = stepRegistry.get("vsdvsv");
    assert.isDefined(step);

    loader.reloadFile(filepath, sourceV2);

    const oldStep = stepRegistry.get("vsdvsv");
    assert.isUndefined(oldStep);

    const newStep = stepRegistry.get("black magic");
    assert.isDefined(newStep);
    assert.isNull(newStep.fn);
    assert.deepEqual(newStep.fileLocations, [{ filePath: filepath, span: { start: 1, end: 3, startChar: 0, endChar: 2 } }]);
    assert.equal(newStep.stepText, "black magic");
    assert.equal(newStep.generalisedText, "black magic");
    assert.isNull(newStep.options);

    done();
  });

  it("Should not reload the steps if content has parse error", function (done) {
    const filepath = "step_implementation.js";

    const sourceV1 = "step('vsdvsv', function () {\n" +
      "\tconsole.log('it does not do anything')\n" +
      "});";

    const sourceV2 = "step('black magic', function () {\n" +
      "\tconsole.log('lets start the magic!');\n" +
      "\\ // syntax error\n" +
      "});";

    loader.reloadFile(filepath, sourceV1);

    const step = stepRegistry.get("vsdvsv");
    assert.isDefined(step);

    loader.reloadFile(filepath, sourceV2);

    const oldStep = stepRegistry.get("vsdvsv");
    assert.isDefined(oldStep);

    const newStep = stepRegistry.get("black magic");
    assert.isUndefined(newStep);
    done();
  });

  it("Should not add the steps with no value", function (done) {
    const filepath = "step_implementation.js";

    const source = "step('', function () {\n" +
      "\tconsole.log('it does not do anything')\n" +
      "});";

    loader.reloadFile(filepath, source);

    const steps = Object.keys(stepRegistry.registry);
    assert.isOk(steps.length == 0);
    done();
  });

  it("Should not add the step aliases with no value in", function (done) {
    const filepath = "step_implementation.js";

    const source = "step(['hello', ''], function () {\n" +
      "\tconsole.log('it does not do anything')\n" +
      "});";

    loader.reloadFile(filepath, source);

    const steps = Object.keys(stepRegistry.registry);
    assert.isOk(steps.length === 1);
    done();
  });
});
