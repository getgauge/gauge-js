import { assert } from "chai";
import stepRegistry from "../src/step-registry.js";
import refactor from "../src/refactor.js";
import factory from "../src/response-factory.js";
import fs from "node:fs";
import sinon from "sinon";

let sandbox, request, response;
let contentInput, contentOutput, info;

describe("Refactor", function () {
  this.timeout(10000);
  before(function () {
    sandbox = sinon.createSandbox();

    sandbox.stub(fs, "readFileSync").callsFake(function () {
      return contentInput;
    });

    sandbox.stub(fs, "writeFileSync").callsFake(function (file, data) {
      contentOutput = data;
    });

    sandbox.stub(stepRegistry, "get").callsFake(function () {
      return info;
    });
  });

  beforeEach(function () {
    contentOutput = contentInput = info = request = response = null;
    response = factory.createRefactorResponse();
  });

  after(function () {
    sandbox.restore();
  });

  it("Should refactor step text without changing function ref", function () {
    const output = [];
    output.push("var vowels=[\n    'a',\n    'e',\n    'i',\n    'o',\n    'u'\n];");
    output.push("hakunaMatata('What a wonderful phrase!');");
    output.push("step('The word <word> has <number> vowels.', function (word, number) {\n});");
    output.push("var myfn = function (number) {\n};");
    output.push("step('There are <number> vowels.', myfn);");
    contentInput = output.join("\n");

    request = {
      oldStepValue: {
        stepValue: "The word {} has {} vowels.",
        parameterizedStepValue: "The word <word> has <number> vowels.",
        parameters: ["word", "number"]
      },
      newStepValue: {
        stepValue: "This English word {} has {} vowels.",
        parameterizedStepValue: "This English word <word> has <number> vowels.",
        parameters: ["word", "number"]
      },
      paramPositions: [{
        oldPosition: 0,
        newPosition: 0
      }, {
        oldPosition: 1,
        newPosition: 1
      }],
      saveChanges: true
    };

    info = {
      fn: function (word, number) { console.log(word, number); },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{ filePath: "test/data/refactor-output.js" }]
    };

    response = refactor(request, response, fs);
    assert.strictEqual(response.refactorResponse.error, "");
    assert.strictEqual(response.refactorResponse.success, true);
    assert.strictEqual(response.refactorResponse.filesChanged.length, 1);
    assert.strictEqual(response.refactorResponse.filesChanged[0], "test/data/refactor-output.js");
    assert.strictEqual(response.refactorResponse.fileChanges.length, 1);
    assert.strictEqual(response.refactorResponse.fileChanges[0].fileName, "test/data/refactor-output.js");
    assert.strictEqual(contentOutput, "var vowels = [\n    'a',\n    'e',\n    'i',\n    'o',\n    'u'\n];\nhakunaMatata('What a wonderful phrase!');\nstep('This English word <word> has <number> vowels.', function (word, number) {\n});\nvar myfn = function (number) {\n};\nstep('There are <number> vowels.', myfn);");
    assert.strictEqual(response.refactorResponse.fileChanges[0].fileContent, contentOutput);
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs, {
      content: "\"This English word <word> has <number> vowels.\"",
      span: {
        start: 9,
        startChar: 5,
        end: 9,
        endChar: 43
      }
    });
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs[1], {
      content: "function (word, number) ",
      span: {
        start: 9,
        startChar: 45,
        end: 9,
        endChar: 69
      }
    });
  });

  it("Should not save changes when request save changes is false", function () {
    const output = [];
    output.push("var vowels=[\n    'a',\n    'e',\n    'i',\n    'o',\n    'u'\n];");
    output.push("hakunaMatata('What a wonderful phrase!');");
    output.push("step('The word <word> has <number> vowels.', function (word, number) {\n});");
    output.push("var myfn = function (number) {\n};");
    output.push("step('There are <number> vowels.', myfn);");
    contentInput = output.join("\n");

    request = {
      oldStepValue: {
        stepValue: "The word {} has {} vowels.",
        parameterizedStepValue: "The word <word> has <number> vowels.",
        parameters: ["word", "number"]
      },
      newStepValue: {
        stepValue: "This English word {} has {} vowels.",
        parameterizedStepValue: "This English word <word> has <number> vowels.",
        parameters: ["word", "number"]
      },
      paramPositions: [{
        oldPosition: 0,
        newPosition: 0
      }, {
        oldPosition: 1,
        newPosition: 1
      }],
      saveChanges: false
    };

    info = {
      fn: function (word, number) { console.log(word, number); },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{ filePath: "test/data/refactor-output.js" }]
    };

    response = refactor(request, response);
    assert.strictEqual(response.refactorResponse.error, "");
    assert.strictEqual(response.refactorResponse.success, true);
    assert.strictEqual(response.refactorResponse.filesChanged.length, 1);
    assert.strictEqual(response.refactorResponse.filesChanged[0], "test/data/refactor-output.js");
    assert.strictEqual(response.refactorResponse.fileChanges.length, 1);
    assert.strictEqual(response.refactorResponse.fileChanges[0].fileName, "test/data/refactor-output.js");
    assert.strictEqual(response.refactorResponse.fileChanges[0].fileContent, "var vowels = [\n    'a',\n    'e',\n    'i',\n    'o',\n    'u'\n];\nhakunaMatata('What a wonderful phrase!');\nstep('This English word <word> has <number> vowels.', function (word, number) {\n});\nvar myfn = function (number) {\n};\nstep('There are <number> vowels.', myfn);");
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs, {
      content: "\"This English word <word> has <number> vowels.\"",
      span: {
        start: 9,
        startChar: 5,
        end: 9,
        endChar: 43
      }
    });
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs[1], {
      content: "function (word, number) ",
      span: {
        start: 9,
        startChar: 45,
        end: 9,
        endChar: 69
      }
    });
    assert.notExists(contentOutput);
  });

  it("Should perform refactoring when param names are changed", function () {
    contentInput = "step('The word <word> has <number> vowels.', function (word, number) {\n});";
    request = {
      oldStepValue: {
        stepValue: "The word {} has {} vowels.",
        parameterizedStepValue: "The word <word> has <number> vowels.",
        parameters: ["word", "number"]
      },
      newStepValue: {
        stepValue: "This English word {} has {} vowels.",
        parameterizedStepValue: "This English word <word_en> has <numbers> vowels.",
        parameters: ["word_en", "numbers"]
      },
      paramPositions: [{
        oldPosition: -1,
        newPosition: 0
      }, {
        oldPosition: -1,
        newPosition: 1
      }],
      saveChanges: true
    };

    info = {
      fn: function (word, number) { console.log(word, number); },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{ filePath: "test/data/refactor-output.js" }]
    };

    response = refactor(request, response);

    assert.strictEqual(contentOutput, "step('This English word <word_en> has <numbers> vowels.', function (arg0, arg1) {\n});");
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs, {
      content: "\"This English word <word_en> has <numbers> vowels.\"",
      span: {
        start: 1,
        startChar: 5,
        end: 1,
        endChar: 43
      }
    });
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs, {
      content: "function (arg0, arg1) ",
      span: {
        start: 1,
        startChar: 45,
        end: 1,
        endChar: 69
      }
    });
  });

  it("Should perform refactoring when params are removed", function () {
    contentInput = "step('The word <word> has <number> vowels.', function (word, number) {\n});";
    request = {
      oldStepValue: {
        stepValue: "The word {} has {} vowels.",
        parameterizedStepValue: "The word <word> has <number> vowels.",
        parameters: ["word", "number"]
      },
      newStepValue: {
        stepValue: "This English word {} has {} vowels.",
        parameterizedStepValue: "This English word has <numbers> vowels.",
        parameters: ["numbers"]
      },
      paramPositions: [{
        oldPosition: -1,
        newPosition: 0
      }],
      saveChanges: true
    };

    info = {
      fn: function (word, number) { console.log(word, number); },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{ filePath: "test/data/refactor-output.js" }]
    };

    response = refactor(request, response);

    assert.strictEqual(contentOutput, "step('This English word has <numbers> vowels.', function (arg0) {\n});");
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs, {
      content: "\"This English word has <numbers> vowels.\"",
      span: {
        start: 1,
        startChar: 5,
        end: 1,
        endChar: 43
      }
    });
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs, {
      content: "function (arg0) ",
      span: {
        start: 1,
        startChar: 45,
        end: 1,
        endChar: 69
      }
    });
  });

  it("Should perform refactoring when params are reordered", function () {
    contentInput = "step('The word <word> has <number> vowels.', function (word, number) {\n});";
    request = {
      oldStepValue: {
        stepValue: "The word {} has {} vowels.",
        parameterizedStepValue: "The word <word> has <number> vowels.",
        parameters: ["word", "number"]
      },
      newStepValue: {
        stepValue: "There are {} vowels in the word {}",
        parameterizedStepValue: "There are <number> vowels in the word <word>.",
        parameters: ["number", "word"]
      },
      paramPositions: [{
        oldPosition: 0,
        newPosition: 1
      }, {
        oldPosition: 1,
        newPosition: 0
      }],
      saveChanges: true
    };

    info = {
      fn: function (word, number) { console.log(word, number); },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{ filePath: "test/data/refactor-output.js" }]
    };

    response = refactor(request, response);

    assert.strictEqual(contentOutput, "step('There are <number> vowels in the word <word>.', function (number, word) {\n});");
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs, {
      content: "\"There are <number> vowels in the word <word>.\"",
      span: {
        start: 1,
        startChar: 5,
        end: 1,
        endChar: 43
      }
    });
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs, {
      content: "function (number, word) ",
      span: {
        start: 1,
        startChar: 45,
        end: 1,
        endChar: 69
      }
    });
  });

  it("Should perform refactoring when new params are added", function () {
    contentInput = "step('The word <word> has <number> vowels.', function (word, number) {\n});";
    request = {
      oldStepValue: {
        stepValue: "The word {} has {} vowels.",
        parameterizedStepValue: "The word <word> has <number> vowels.",
        parameters: ["word", "number"]
      },
      newStepValue: {
        stepValue: "The word {} has {} vowels and ends with {}.",
        parameterizedStepValue: "The word <word> has <number> vowels and ends with <end_letter>.",
        parameters: ["word", "number", "end_letter"]
      },
      paramPositions: [{
        oldPosition: 0,
        newPosition: 0
      }, {
        oldPosition: 1,
        newPosition: 1
      }, {
        oldPosition: -1,
        newPosition: 2
      }],
      saveChanges: true
    };

    info = {
      fn: function (word, number) { console.log(word, number); },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{ filePath: "test/data/refactor-output.js" }]
    };

    response = refactor(request, response);

    assert.strictEqual(contentOutput, "step('The word <word> has <number> vowels and ends with <end_letter>.', function (word, number, arg2) {\n});");
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs, {
      content: "\"The word <word> has <number> vowels and ends with <end_letter>.\"",
      span: {
        start: 1,
        startChar: 5,
        end: 1,
        endChar: 43
      }
    });
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs, {
      content: "function (word, number, arg2) ",
      span: {
        start: 1,
        startChar: 45,
        end: 1,
        endChar: 69
      }
    });
  });

  it("Should perform refactoring while retaining callbacks for async step implementation calls", function () {
    contentInput = "step('The word <word> has <number> vowels.', function (word, number, done) {\n});";
    request = {
      oldStepValue: {
        stepValue: "The word {} has {} vowels.",
        parameterizedStepValue: "The word <word> has <number> vowels.",
        parameters: ["word", "number"]
      },
      newStepValue: {
        stepValue: "This English word {} has {} vowels.",
        parameterizedStepValue: "This English word <word> has <numbers> vowels.",
        parameters: ["word", "numbers"]
      },
      paramPositions: [{
        oldPosition: 0,
        newPosition: 0
      }, {
        oldPosition: -1,
        newPosition: 1
      }],
      saveChanges: true
    };

    info = {
      fn: function (word, number, done) { console.log(word, number, done); },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{ filePath: "test/data/refactor-output.js" }]
    };

    response = refactor(request, response);

    assert.strictEqual(contentOutput, "step('This English word <word> has <numbers> vowels.', function (word, arg1, done) {\n});");
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs, {
      content: "\"This English word <word> has <numbers> vowels.\"",
      span: {
        start: 1,
        startChar: 5,
        end: 1,
        endChar: 43
      }
    });
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs, {
      content: "function (word, arg1, done) ",
      span: {
        start: 1,
        startChar: 45,
        end: 1,
        endChar: 75
      }
    });
  });

  it("Should perform refactoring when new params are interchanged", function () {
    contentInput = "step('The word <word> has <number> vowels.', function (word, number) {\n});";
    request = {
      oldStepValue: {
        stepValue: "The word {} has {} vowels.",
        parameterizedStepValue: "The word <word> has <number> vowels.",
        parameters: ["word", "number"]
      },
      newStepValue: {
        stepValue: "There are {} of vowels in {}.",
        parameterizedStepValue: "There are <number> of vowels in <word>.",
        parameters: ["number", "word"]
      },
      paramPositions: [{
        oldPosition: 0,
        newPosition: 1
      }, {
        oldPosition: 1,
        newPosition: 0
      }],
      saveChanges: true
    };

    info = {
      fn: function (word, number) { console.log(word, number); },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{ filePath: "test/data/refactor-output.js" }]
    };

    response = refactor(request, response);

    assert.strictEqual(contentOutput, "step('There are <number> of vowels in <word>.', function (number, word) {\n});");
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs, {
      content: "\"There are <number> of vowels in <word>.\"",
      span: {
        start: 1,
        startChar: 5,
        end: 1,
        endChar: 43
      }
    });
    assert.deepInclude(response.refactorResponse.fileChanges[0].diffs, {
      content: "function (number, word) ",
      span: {
        start: 1,
        startChar: 45,
        end: 1,
        endChar: 69
      }
    });
  });
});
