var assert = require("chai").assert;
var loader = require("../src/static-loader");
var stepRegistry = require("../src/step-registry");

describe("Static loader", function() {
  beforeEach(function () {
    stepRegistry.clear();
  });

  it("Should load the steps from provided js contents", function(done) {
    var filepath = "step_implementation.js";
    var source = "step('vsdvsv', function () {\n"+
      "\tassert.equal(+number, numberOfVowels(word));\n"+
      "});";

    loader.loadFile(filepath,source);
    var step = stepRegistry.get("vsdvsv");
    assert.isDefined(step);
    assert.isNull(step.fn);
    assert.deepEqual(step.fileLocations, [{filePath: filepath,line:1}]);
    assert.equal(step.stepText, "vsdvsv");
    assert.equal(step.generalisedText, "vsdvsv");
    assert.isNull(step.options);
    done();
  });

  it("Should load the aliases steps from provided js contents", function(done) {
    var filepath = "step_implementation.js";
    var source = "step(['vsdvsv', 'oohooo'], function () {\n"+
      "\tassert.equal(+number, numberOfVowels(word));\n"+
      "});";

    loader.loadFile(filepath,source);
    var steps = stepRegistry.getStepTexts();
    assert.equal(steps.length, 2);
    assert.deepEqual(steps, ["vsdvsv", "oohooo"]);
    done();
  });

  it("Should reload the steps from for a given file and content", function(done) {
    var filepath = "step_implementation.js";

    var sourceV1 = "step('vsdvsv', function () {\n"+
      "\tconsole.log('it does not do anything')\n"+
      "});";

    var sourceV2 = "step('black magic', function () {\n"+
      "\tconsole.log('lets start the magic!');\n"+
    "});";

    loader.loadFile(filepath,sourceV1);

    var step = stepRegistry.get("vsdvsv");
    assert.isDefined(step);

    loader.reloadFile(filepath,sourceV2);

    var oldStep = stepRegistry.get("vsdvsv");
    assert.isUndefined(oldStep);

    var newStep = stepRegistry.get("black magic");
    assert.isDefined(newStep);
    assert.isNull(newStep.fn);
    assert.deepEqual(newStep.fileLocations, [{ filePath: filepath, line: 1 }]);
    assert.equal(newStep.stepText, "black magic");
    assert.equal(newStep.generalisedText, "black magic");
    assert.isNull(newStep.options);

    done();
  });
});
