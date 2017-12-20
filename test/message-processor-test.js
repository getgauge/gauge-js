var assert = require("chai").assert;
var sinon = require("sinon");
var protobuf = require("protobufjs");
var esprima = require("esprima");
var stepRegistry = require("../src/step-registry");
var loader = require("../src/static-loader");
var MessageProcessor = require("../src/message-processor");

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
            stepText: "A context step which gets executed before every scenario",
            numberOfParameters: 0,
            stepValue: {
              parameterizedStepValue: "A context step which gets executed before every scenario",
              parameters: []
            }
          }
        }),
        message.create({
          messageId: 1,
          messageType: message.MessageType.StepValidateRequest,
          stepValidateRequest: {
            stepText: "Say {} to {}",
            numberOfParameters: 0,
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

    new MessageProcessor({message: message, errorType: {values: {}}}).getResponseFor(stepValidateRequest[0]);

    assert(stepRegistry.validate.calledOnce);
    assert.equal("A context step which gets executed before every scenario", stepRegistry.validate.getCall(0).args[0]);
    done();

  });

  it("StepValidateRequest should get back StepValidateResponse with isValid set to true if the step exists", function (done) {
    var processor = new MessageProcessor({message: message});
    processor.on("messageProcessed", function (response) {
      assert.deepEqual(stepValidateRequest[1].messageId, response.messageId);
      assert.equal(message.MessageType.StepValidateResponse, response.messageType);
      assert.equal(true, response.stepValidateResponse.isValid);
      done();
    });
    processor.getResponseFor(stepValidateRequest[1]);
  });

  it("StepValidateRequest should get back StepValidateResponse with isValid set to false if the step does not exist", function (done) {
    var processor = new MessageProcessor({message: message, errorType: {values: {}}});
    processor.on("messageProcessed", function (response) {
      var stub = "step(\"A context step which gets executed before every scenario\", async function() {\n\t" +
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
      "step(\"A context step which gets executed before every scenario\", function() {\n" +
      "  console.log('in context step');\n" +
      "});\n";

    loader.loadFile(filePath, esprima.parse(content, {loc: true}));

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
    var processor = new MessageProcessor({message: message, errorType: {values: {}}});
    processor.on("messageProcessed", function (response) {
      assert.deepEqual(stepNameRequest.messageId, response.messageId);
      assert.equal(message.MessageType.StepNameResponse, response.messageType);
      assert.equal(true, response.stepNameResponse.isStepPresent);
      assert.equal(response.stepNameResponse.fileName, "example.js");
      assert.deepEqual(response.stepNameResponse.span, {start: 4, end: 6, startChar: 0, endChar: 2});
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

    loader.loadFile(filePath, esprima.parse(content, {loc: true}));
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
    var processor = new MessageProcessor({message: message, errorType: {values: {}}});
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
