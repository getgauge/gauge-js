var assert = require("chai").assert;
var sinon = require("sinon");
var protobuf = require("protobufjs");
var stepRegistry = require("../src/step-registry");
var loader = require("../src/static-loader");
var MessageProcessor = require("../src/message-processor").MessageProcessor;
var mock = require("mock-fs");
var fs = require("fs");
var path = require("path");

describe("Step Validate Request Processing", function () {
  var stepValidateRequest = [];
  var message = null;
  this.timeout(10000);
  before(function (done) {
    stepRegistry.clear();
    stepRegistry.add("Say {} to {}", function () {
    });
    sinon.spy(stepRegistry, "validate");
    protobuf.load("gauge-proto/messages.proto").then(function (root) {
      message = root.lookupType("gauge.messages.Message");
      stepValidateRequest = [
        message.create({
          messageId: 1,
          messageType: message.MessageType.StepValidateRequest,
          stepValidateRequest: {
            stepText: "A context step which takes two params {} and {}",
            numberOfParameters: 2,
            stepValue: {
              stepValue: "A context step which takes two params {} and {}",
              parameterizedStepValue: "A context step which takes two params <hello> and <blah>",
              parameters: ["hello", "blah"]
            }
          }
        }),
        message.create({
          messageId: 1,
          messageType: message.MessageType.StepValidateRequest,
          stepValidateRequest: {
            stepText: "Say {} to {}",
            numberOfParameters: 2,
            stepValue: {
              parameterizedStepValue: "Say \"hi\" to \"gauge\"",
              parameters: ["hi", "gauge"]
            }
          }
        })
      ];
      done();
    });
  });

  after(function () {
    stepRegistry.validate.restore();
  });

  it("Should check if step exists in step registry when a StepValidateRequest is received", function (done) {

    new MessageProcessor({ message: message, errorType: { values: {} } }).getResponseFor(stepValidateRequest[0]);

    assert(stepRegistry.validate.calledOnce);
    assert.equal("A context step which takes two params {} and {}", stepRegistry.validate.getCall(0).args[0]);
    done();

  });

  it("StepValidateRequest should get back StepValidateResponse with isValid set to true if the step exists", function (done) {
    var processor = new MessageProcessor({ message: message });
    processor.on("messageProcessed", function (response) {
      assert.deepEqual(stepValidateRequest[1].messageId, response.messageId);
      assert.equal(message.MessageType.StepValidateResponse, response.messageType);
      assert.equal(true, response.stepValidateResponse.isValid);
      done();
    });
    processor.getResponseFor(stepValidateRequest[1]);
  });

  it("StepValidateRequest should get back StepValidateResponse with isValid set to false if the step does not exist", function (done) {
    var processor = new MessageProcessor({ message: message, errorType: { values: {} } });
    processor.on("messageProcessed", function (response) {
      var stub = "step(\"A context step which takes two params <arg0> and <arg1>\", async function(arg0, arg1) {\n\t" +
        "throw 'Unimplemented Step';\n});";

      assert.deepEqual(stepValidateRequest[0].messageId, response.messageId);
      assert.equal(message.MessageType.StepValidateResponse, response.messageType);
      assert.equal(false, response.stepValidateResponse.isValid);
      assert.equal(stub, response.stepValidateResponse.suggestion);
      done();
    });
    processor.getResponseFor(stepValidateRequest[0]);
  });
});

describe("StepNameRequest Processing", function () {
  var stepNameRequest = [];
  var message = null;
  this.timeout(10000);
  before(function (done) {
    var filePath = "example.js";
    stepRegistry.clear();
    var content = "\"use strict\";\n" +
      "var assert = require(\"assert\");\n" +
      "var vowels = require(\"./vowels\");\n" +
      "step([\"A context step which gets executed before every scenario\", \"A context step.\"], function() {\n" +
      "  console.log('in context step');\n" +
      "});\n";

    loader.reloadFile(filePath, content);

    protobuf.load("gauge-proto/messages.proto").then(function (root) {
      message = root.lookupType("gauge.messages.Message");
      stepNameRequest =
        message.create({
          messageId: 1,
          messageType: message.MessageType.StepNameRequest,
          stepNameRequest: {
            stepValue: "A context step which gets executed before every scenario",
          }
        });
      done();
    });
  });

  it("StepNameRequest should get back StepNameResponse with fileName and span", function (done) {
    var processor = new MessageProcessor({ message: message, errorType: { values: {} } });
    processor.on("messageProcessed", function (response) {
      assert.deepEqual(stepNameRequest.messageId, response.messageId);
      assert.equal(message.MessageType.StepNameResponse, response.messageType);
      assert.equal(true, response.stepNameResponse.isStepPresent);
      assert.equal(response.stepNameResponse.fileName, "example.js");
      assert.deepEqual(response.stepNameResponse.span, { start: 4, end: 6, startChar: 0, endChar: 2 });
      done();
    });
    processor.getResponseFor(stepNameRequest);
  });

  it("StepNameRequest should respond with all aliases for a given step", function (done) {
    var processor = new MessageProcessor({ message: message, errorType: { values: {} } });
    processor.on("messageProcessed", function (response) {
      assert.deepEqual(response.messageId, stepNameRequest.messageId);
      assert.equal(response.messageType, message.MessageType.StepNameResponse);
      assert.equal(response.stepNameResponse.isStepPresent, true);
      assert.equal(response.stepNameResponse.hasAlias, true);
      assert.deepEqual(response.stepNameResponse.stepName, ["A context step which gets executed before every scenario", "A context step."]);
      done();
    });
    processor.getResponseFor(stepNameRequest);
  });
});

describe("StepPositionsRequest Processing", function () {
  var stepPositionsRequest = [];
  var message = null;
  this.timeout(10000);

  before(function (done) {
    var filePath = "example.js";
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
    protobuf.load("gauge-proto/messages.proto").then(function (root) {
      message = root.lookupType("gauge.messages.Message");
      stepPositionsRequest =
        message.create({
          messageId: 1,
          messageType: message.MessageType.StepPositionsRequest,
          stepPositionsRequest: {
            filePath: filePath
          }
        });
      done();
    });
  });

  it("StepPositionsRequest should get back StepPositionsResponse with stepValue and lineNumber", function (done) {
    var processor = new MessageProcessor({ message: message, errorType: { values: {} } });
    processor.on("messageProcessed", function (response) {
      assert.deepEqual(stepPositionsRequest.messageId, response.messageId);
      assert.equal(message.MessageType.StepPositionsResponse, response.messageType);
      assert.equal("", response.stepPositionsResponse.error);
      assert.equal(2, response.stepPositionsResponse.stepPositions.length);
      assert.equal(1, response.stepPositionsResponse.stepPositions.filter(function (stepPosition) {
        return stepPosition.stepValue === "Vowels in English language are {}." && stepPosition.span.start === 4;
      }).length);
      assert.equal(1, response.stepPositionsResponse.stepPositions.filter(function (stepPosition) {
        return stepPosition.stepValue === "The word {} has {} vowels." && stepPosition.span.start === 7;
      }).length);
      done();
    });
    processor.getResponseFor(stepPositionsRequest);
  });
});

describe("CacheFileRequest Processing", function () {
  var message = null;
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
    return message.create({
      messageId: 1,
      messageType: message.MessageType.CacheFileRequest,
      cacheFileRequest: {
        filePath: filePath,
        status: status
      }
    });
  };

  before(function (done) {
    process.env.GAUGE_PROJECT_ROOT = process.cwd();
    stepRegistry.clear();
    protobuf.load("gauge-proto/messages.proto").then(function (root) {
      message = root.lookupType("gauge.messages.Message");
      fileStatus = root.lookupEnum("gauge.messages.CacheFileRequest.FileStatus");
      done();
    });
  });

  afterEach(function () {
    fs.readFileSync.restore();
    fs.existsSync.restore();
  });

  it("should reload files on create", function () {
    var cacheFileRequest = getCacheFileRequestMessage(filePath, fileStatus.valuesById[fileStatus.values.CREATED]);

    const mockedExistsSync = sinon.stub(fs,"existsSync");
    const mockedReadfileSync = sinon.stub(fs,"readFileSync");
    mockedExistsSync.withArgs(path.join(process.cwd(),"tests/example.js")).returns(true);
    mockedReadfileSync.withArgs(path.join(process.cwd(),"tests/example.js")).returns(fileContent);

    var processor = new MessageProcessor({ message: message, errorType: { values: {} }, fileStatus: fileStatus });
    processor.getResponseFor(cacheFileRequest);
    assert.isNotEmpty(stepRegistry.get("Vowels in English language are {}."));
  });

  it("should not reload files on create if file is cached already", function () {
    var cacheFileRequest = getCacheFileRequestMessage(filePath, fileStatus.valuesById[fileStatus.values.CREATED]);

    const mockedExistsSync = sinon.stub(fs,"existsSync");
    const mockedReadfileSync = sinon.stub(fs,"readFileSync");
    mockedExistsSync.withArgs(path.join(process.cwd(),"tests/example.js")).returns(true);
    mockedReadfileSync.withArgs(path.join(process.cwd(),"tests/example.js")).returns("");

    loader.reloadFile(filePath, fileContent);
    assert.isNotEmpty(stepRegistry.get("Vowels in English language are {}."));
    var processor = new MessageProcessor({ message: message, errorType: { values: {} }, fileStatus: fileStatus });
    processor.getResponseFor(cacheFileRequest);
    assert.isNotEmpty(stepRegistry.get("Vowels in English language are {}."));
  });

  it("should unload file on delete.", function () {
    var cacheFileRequest = getCacheFileRequestMessage(filePath, fileStatus.valuesById[fileStatus.values.DELETED]);

    const mockedExistsSync = sinon.stub(fs,"existsSync");
    const mockedReadfileSync = sinon.stub(fs,"readFileSync");
    mockedExistsSync.withArgs().returns();
    mockedReadfileSync.withArgs().returns();

    loader.reloadFile(filePath, fileContent);
    assert.isNotEmpty(stepRegistry.get("Vowels in English language are {}."));
    var processor = new MessageProcessor({ message: message, errorType: { values: {} }, fileStatus: fileStatus });
    processor.getResponseFor(cacheFileRequest);
    assert.isUndefined(stepRegistry.get("Vowels in English language are {}."));
  });

  it("should reload file from disk on closed.", function () {
    var cacheFileRequest = getCacheFileRequestMessage(filePath, fileStatus.valuesById[fileStatus.values.CLOSED]);

    const mockedExistsSync = sinon.stub(fs,"existsSync");
    const mockedReadfileSync = sinon.stub(fs,"readFileSync");
    mockedExistsSync.withArgs(path.join(process.cwd(),"tests/example.js")).returns(true);
    mockedReadfileSync.withArgs(path.join(process.cwd(),"tests/example.js")).returns(fileContent);

    loader.reloadFile(filePath, fileContent);
    var processor = new MessageProcessor({ message: message, errorType: { values: {} }, fileStatus: fileStatus });
    processor.getResponseFor(cacheFileRequest);
    assert.isNotEmpty(stepRegistry.get("Vowels in English language are {}."));
  });

  it("should unload file from disk on closed and file does not exists.", function () {
    var cacheFileRequest = getCacheFileRequestMessage(filePath, fileStatus.valuesById[fileStatus.values.CLOSED]);

    const mockedExistsSync = sinon.stub(fs,"existsSync");
    const mockedReadfileSync = sinon.stub(fs,"readFileSync");
    mockedExistsSync.withArgs(path.join(process.cwd(),"tests/example.js")).returns(false);
    mockedReadfileSync.withArgs().returns();

    loader.reloadFile(filePath, fileContent);
    var processor = new MessageProcessor({ message: message, errorType: { values: {} }, fileStatus: fileStatus });
    processor.getResponseFor(cacheFileRequest);
    assert.isUndefined(stepRegistry.get("Vowels in English language are {}."));
  });

  it("should load changed content on file opened", function () {
    var cacheFileRequest = getCacheFileRequestMessage(filePath, fileStatus.valuesById[fileStatus.values.OPENED]);

    const mockedExistsSync = sinon.stub(fs,"existsSync");
    const mockedReadfileSync = sinon.stub(fs,"readFileSync");
    mockedExistsSync.withArgs().returns();
    mockedReadfileSync.withArgs().returns();

    cacheFileRequest.cacheFileRequest.content = fileContent;
    var processor = new MessageProcessor({ message: message, errorType: { values: {} }, fileStatus: fileStatus });
    processor.getResponseFor(cacheFileRequest);
    assert.isNotEmpty(stepRegistry.get("Vowels in English language are {}."));
  });

  it("should load changed content on file changed", function () {
    var cacheFileRequest = getCacheFileRequestMessage(filePath, fileStatus.valuesById[fileStatus.values.OPENED]);

    const mockedExistsSync = sinon.stub(fs,"existsSync");
    const mockedReadfileSync = sinon.stub(fs,"readFileSync");
    mockedExistsSync.withArgs().returns();
    mockedReadfileSync.withArgs().returns();

    cacheFileRequest.cacheFileRequest.content = fileContent;
    var processor = new MessageProcessor({ message: message, errorType: { values: {} }, fileStatus: fileStatus });
    processor.getResponseFor(cacheFileRequest);
    assert.isNotEmpty(stepRegistry.get("Vowels in English language are {}."));
  });
});

describe("ImplementationFileGlobPatternRequest Processing", function () {
  var message = null;
  this.timeout(10000);
  var implementationFileGlobPatternMessage;
  var projectRoot = "exampleProject";

  before(function (done) {
    process.env.GAUGE_PROJECT_ROOT = projectRoot;
    stepRegistry.clear();
    protobuf.load("gauge-proto/messages.proto").then(function (root) {
      message = root.lookupType("gauge.messages.Message");
      implementationFileGlobPatternMessage = message.create({
        messageId: 1,
        messageType: message.MessageType.ImplementationFileGlobPatternRequest,
        implementationFileGlobPatternRequest: {}
      });
      done();
    });
  });

  after(function () {
    process.env.GAUGE_PROJECT_ROOT = process.cwd();
    process.env.STEP_IMPL_DIR = "";
  });

  it("should return glob pattern for default test directory", function () {
    var processor = new MessageProcessor({ message: message, errorType: { values: {} }, fileStatus: { values: {} } });
    processor.on("messageProcessed", function (response) {
      var expectedGlobPattern = [projectRoot + "/tests/**/*.js"];
      assert.deepEqual(response.implementationFileGlobPatternResponse.globPatterns, expectedGlobPattern);
    });
    processor.getResponseFor(implementationFileGlobPatternMessage);
  });

  it("should return glob patterns when multiple test directories present", function () {
    process.env.STEP_IMPL_DIR = "test1, test2";
    var processor = new MessageProcessor({ message: message, errorType: { values: {} }, fileStatus: { values: {} } });
    processor.on("messageProcessed", function (response) {
      var expectedGlobPatterns = [projectRoot + "/test1/**/*.js", projectRoot + "/test2/**/*.js"];
      assert.deepEqual(response.implementationFileGlobPatternResponse.globPatterns, expectedGlobPatterns);
    });
    processor.getResponseFor(implementationFileGlobPatternMessage);
  });
});