var assert = require("chai").assert;
var sinon = require("sinon");
var protobuf = require("protobufjs");
var stepRegistry = require("../src/step-registry");
var hookRegistry = require("../src/hook-registry");
var loader = require("../src/static-loader");
var dataStore = require("../src/data-store-factory");
var  { executeBeforeSuiteHook, executeBeforeSpecHook, executeBeforeScenarioHook, stepValidateResponse, stepNameResponse, stepPositions, cacheFileResponse, implementationGlobPatternResponse } = require("../src/message-processor");
var mock = require("mock-fs");
var path = require("path");

describe("Step Validate Request Processing", function () {
  var stepValidateRequests = [];
  var errorType = null;
  this.timeout(10000);
  before(function (done) {
    stepRegistry.clear();
    stepRegistry.add("Say {} to {}", function () {
    });
    sinon.spy(stepRegistry, "validate");
    protobuf.load("gauge-proto/messages.proto").then(function (root) {
      errorType = root.lookupEnum("gauge.messages.StepValidateResponse.ErrorType");
      stepValidateRequests = [
        {
          stepText: "A context step which takes two params {} and {}",
          numberOfParameters: 2,
          stepValue: {
            stepValue: "A context step which takes two params {} and {}",
            parameterizedStepValue: "A context step which takes two params <hello> and <blah>",
            parameters: ["hello", "blah"]
          }
        },{
          stepText: "Say {} to {}",
          numberOfParameters: 2,
          stepValue: {
            parameterizedStepValue: "Say \"hi\" to \"gauge\"",
            parameters: ["hi", "gauge"]
          }
        }
      ];
      done();
    });
  });

  after(function () {
    stepRegistry.validate.restore();
  });

  it("Should check if step exists in step registry when a StepValidateRequest is received", function (done) {

    stepValidateResponse(stepValidateRequests[0], errorType);

    assert(stepRegistry.validate.calledOnce);
    assert.equal("A context step which takes two params {} and {}", stepRegistry.validate.getCall(0).args[0]);
    done();

  });

  it("StepValidateRequest should get back StepValidateResponse when step does exists", function () {
    const expectedResponse = { stepValidateResponse:{ isValid: true} };
    const response = stepValidateResponse(stepValidateRequests[1], errorType);
    assert.ok(response.stepValidateResponse.isValid);
    assert.deepEqual(response, expectedResponse);
  });

  it("StepValidateRequest should get back StepValidateResponse when step does not exist", function ( ) {
    const stub = "step(\"A context step which takes two params <arg0> and <arg1>\", async function(arg0, arg1) {\n\t" +
        "throw 'Unimplemented Step';\n});";
    const expectedResponse = {
      stepValidateResponse:{
        isValid: false,
        errorType: errorType.values.STEP_IMPLEMENTATION_NOT_FOUND,
        errorMessage: "Invalid step.",
        suggestion: stub
      }
    };
    const response = stepValidateResponse(stepValidateRequests[0], errorType);

    assert.deepEqual(response, expectedResponse);
  });
});

describe("StepNameRequest Processing", function () {
  var stepNameRequest = [];
  this.timeout(10000);
  before(function () {
    var filePath = "example.js";
    stepRegistry.clear();
    var content = "\"use strict\";\n" +
      "var assert = require(\"assert\");\n" +
      "var vowels = require(\"./vowels\");\n" +
      "step([\"A context step which gets executed before every scenario\", \"A context step.\"], function() {\n" +
      "  console.log('in context step');\n" +
      "});\n";

    loader.reloadFile(filePath, content);
    stepNameRequest ={
      stepValue: "A context step which gets executed before every scenario",
    };

  });

  it("StepNameRequest should get back StepNameResponse with fileName and span", function () {

    const response = stepNameResponse(stepNameRequest);

    assert.equal(true, response.stepNameResponse.isStepPresent);
    assert.equal(response.stepNameResponse.fileName, "example.js");
    assert.deepEqual(response.stepNameResponse.span, { start: 4, end: 6, startChar: 0, endChar: 2 });

  });

  it("StepNameRequest should respond with all aliases for a given step", function () {

    const response = stepNameResponse(stepNameRequest);

    assert.equal(response.stepNameResponse.isStepPresent, true);
    assert.equal(response.stepNameResponse.hasAlias, true);
    assert.deepEqual(response.stepNameResponse.stepName, ["A context step which gets executed before every scenario", "A context step."]);
  });
});

describe("StepPositionsRequest Processing", function () {
  var filePath = "example.js";
  this.timeout(10000);

  before(function () {
    stepRegistry.clear();
    var content = "\"use strict\";\n" +
      "var assert = require(\"assert\");\n" +
      "var vowels = require(\"./vowels\");\n" +
      "step(\"Vowels in English language are <vowels>.\", function(vowelsGiven) {\n" +
      "  assert.equal(vowelsGiven, vowels.vowelList.join(\"\"));\n" +
      "});\n" +
      "step(\"The word <word> has <number> vowels.\", function(word, number) {\n" +
      "  assert.equal(number, vowels.numVowels(word));\n" +
      "});";

    loader.reloadFile(filePath, content);
  });

  it("StepPositionsRequest should get back StepPositionsResponse with stepValue and lineNumber", function () {
    var stepPositionsRequest = {
      filePath: filePath
    };
    const response = stepPositions(stepPositionsRequest);

    assert.equal("", response.stepPositionsResponse.error);
    assert.equal(2, response.stepPositionsResponse.stepPositions.length);
    assert.equal(1, response.stepPositionsResponse.stepPositions.filter(function (stepPosition) {
      return stepPosition.stepValue === "Vowels in English language are {}." && stepPosition.span.start === 4;
    }).length);
    assert.equal(1, response.stepPositionsResponse.stepPositions.filter(function (stepPosition) {
      return stepPosition.stepValue === "The word {} has {} vowels." && stepPosition.span.start === 7;
    }).length);
  });
});

describe("CacheFileRequest Processing", function () {
  var fileStatus = null;
  var filePath = path.join(process.cwd(), "tests", "example.js");
  var fileContent = "\"use strict\";\n" +
    "var assert = require(\"assert\");\n" +
    "var vowels = require(\"./vowels\");\n" +
    "step(\"Vowels in English language are <vowels>.\", function(vowelsGiven) {\n" +
    "  assert.equal(vowelsGiven, vowels.vowelList.join(\"\"));\n" +
    "});";
  this.timeout(10000);

  var getCacheFileRequestMessage = function (filePath, status) {
    return {
      filePath: filePath,
      status: status
    };
  };

  before(function (done) {
    process.env.GAUGE_PROJECT_ROOT = process.cwd();
    stepRegistry.clear();
    protobuf.load("gauge-proto/messages.proto").then(function (root) {
      fileStatus = root.lookupEnum("gauge.messages.CacheFileRequest.FileStatus");
      done();
    });
  });

  afterEach(function () {
    mock.restore();
  });

  it("should reload files on create", function () {
    var cacheFileRequest = getCacheFileRequestMessage(filePath, fileStatus.valuesById[fileStatus.values.CREATED]);
    mock({
      "tests": {
        "example.js": fileContent
      }
    });
    cacheFileResponse(cacheFileRequest, fileStatus);
    assert.isNotEmpty(stepRegistry.get("Vowels in English language are {}."));
  });

  it("should not reload files on create if file is cached already", function () {
    var cacheFileRequest = getCacheFileRequestMessage(filePath, fileStatus.valuesById[fileStatus.values.CREATED]);
    mock({
      "tests": {
        "example.js": ""
      }
    });
    loader.reloadFile(filePath, fileContent);
    assert.isNotEmpty(stepRegistry.get("Vowels in English language are {}."));

    cacheFileResponse(cacheFileRequest, fileStatus);
    assert.isNotEmpty(stepRegistry.get("Vowels in English language are {}."));
  });

  it("should unload file on delete.", function () {
    var cacheFileRequest = getCacheFileRequestMessage(filePath, fileStatus.valuesById[fileStatus.values.DELETED]);
    loader.reloadFile(filePath, fileContent);
    assert.isNotEmpty(stepRegistry.get("Vowels in English language are {}."));

    cacheFileResponse(cacheFileRequest, fileStatus);
    assert.isUndefined(stepRegistry.get("Vowels in English language are {}."));
  });

  it("should reload file from disk on closed.", function () {
    var cacheFileRequest = getCacheFileRequestMessage(filePath, fileStatus.valuesById[fileStatus.values.CLOSED]);
    mock({
      "tests": {
        "example.js": fileContent
      }
    });
    loader.reloadFile(filePath, fileContent);

    cacheFileResponse(cacheFileRequest, fileStatus);
    assert.isNotEmpty(stepRegistry.get("Vowels in English language are {}."));
  });

  it("should unload file from disk on closed and file does not exists.", function () {
    var cacheFileRequest = getCacheFileRequestMessage(filePath, fileStatus.valuesById[fileStatus.values.CLOSED]);
    mock({
      "tests": {}
    });
    loader.reloadFile(filePath, fileContent);

    cacheFileResponse(cacheFileRequest, fileStatus);
    assert.isUndefined(stepRegistry.get("Vowels in English language are {}."));
  });

  it("should load changed content on file opened", function () {
    var cacheFileRequest = getCacheFileRequestMessage(filePath, fileStatus.valuesById[fileStatus.values.OPENED]);
    cacheFileRequest.content = fileContent;

    cacheFileResponse(cacheFileRequest, fileStatus);
    assert.isNotEmpty(stepRegistry.get("Vowels in English language are {}."));
  });

  it("should load changed content on file changed", function () {
    var cacheFileRequest = getCacheFileRequestMessage(filePath, fileStatus.valuesById[fileStatus.values.OPENED]);
    cacheFileRequest.content = fileContent;

    cacheFileResponse(cacheFileRequest, fileStatus);
    assert.isNotEmpty(stepRegistry.get("Vowels in English language are {}."));
  });
});

describe("ImplementationFileGlobPatternRequest Processing", function () {
  this.timeout(10000);
  var implementationFileGlobPatternRequest;
  var projectRoot = "exampleProject";

  before(function () {
    process.env.GAUGE_PROJECT_ROOT = projectRoot;
    stepRegistry.clear();
    implementationFileGlobPatternRequest = {};

  });

  after(function () {
    process.env.GAUGE_PROJECT_ROOT = process.cwd();
    process.env.STEP_IMPL_DIR = "";
  });

  it("should return glob pattern for default test directory", function () {
    const response = implementationGlobPatternResponse(implementationFileGlobPatternRequest);
    var expectedGlobPattern = [projectRoot + "/tests/**/*.js"];
    assert.deepEqual(response.implementationFileGlobPatternResponse.globPatterns, expectedGlobPattern);
  });

  it("should return glob patterns when multiple test directories present", function () {
    process.env.STEP_IMPL_DIR = "test1, test2";
    const response = implementationGlobPatternResponse(implementationFileGlobPatternRequest);
    var expectedGlobPatterns = [projectRoot + "/test1/**/*.js", projectRoot + "/test2/**/*.js"];
    assert.deepEqual(response.implementationFileGlobPatternResponse.globPatterns, expectedGlobPatterns);
  });
});

describe("BeforeSpecHook", function () {
  this.timeout(10000);
  var projectRoot = "exampleProject";

  before(function () {
    process.env.GAUGE_PROJECT_ROOT = projectRoot;
    stepRegistry.clear();
    hookRegistry.clear();
    dataStore.suiteStore.clear();
    process.env.STEP_IMPL_DIR = "test1";
    mock( {
      exampleProject: {
        test1: {
          "example.js":`
            beforeSuite( () => {
              gauge.dataStore.suiteStore.put("executedBeforeSuiteHook", true);
            });
            beforeSpec( () => {
              gauge.dataStore.specStore.put("executedBeforeSpecHook", true);
            })
            beforeScenario( () => {
              gauge.dataStore.scenarioStore.put("executedBeforeScenarioHook", true);
            })
        `
        }
      }
    });
  });

  after(function () {
    process.env.GAUGE_PROJECT_ROOT = process.cwd();
    process.env.STEP_IMPL_DIR = "";
  });

  it("should execute before suite hook and return a success response", function (done) {
    function callback(response) {
      assert.notOk(response.executionResult.failed);
      assert.ok(dataStore.suiteStore.get("executedBeforeSuiteHook"));
      done();
    }
    executeBeforeSuiteHook({executionStartingRequest: {} }, callback);
  });

  it("should execute before spec hook and return a success response", function (done) {
    function callback(response) {
      assert.notOk(response.executionResult.failed);
      assert.ok(dataStore.specStore.get("executedBeforeSpecHook"));
      done();
    }
    executeBeforeSpecHook({specExecutionStartingRequest: {} }, callback);
  });

  it("should execute before scenario hook and return a success response", function (done) {
    function callback(response) {
      assert.notOk(response.executionResult.failed);
      assert.ok(dataStore.scenarioStore.get("executedBeforeScenarioHook"));
      done();
    }
    executeBeforeScenarioHook({scenarioExecutionStartingRequest: {} }, callback);
  });
});