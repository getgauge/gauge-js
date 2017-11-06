var assert = require("chai").assert;
var sinon = require("sinon");
var protobuf = require("protobufjs");
var stepRegistry = require("../src/step-registry");
var MessageProcessor = require("../src/message-processor");
var fs = require("fs");

describe("Step Validate Request Processing", function () {

  var stepValidateRequest = [];
  var message = null;
  this.timeout(10000);

  before(function (done) {
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
            stepValue : {
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
            stepValue : {
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
      var stub = "step(\"A context step which gets executed before every scenario\", function() {\n\t"+
        "throw new Error(\"Provide custom implementation\");\n});";

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
  var stepNameRequest= [];
  var message = null;
  var sandbox;
  this.timeout(10000);
  before(function (done) {
    stepRegistry.add("A context step which gets executed before every scenario", function () {
    });

    sandbox = sinon.sandbox.create();
    sandbox.stub(fs, "readFileSync").returns("'use strict';\nstep('A context step which gets executed before every scenario', function () {\n" +
      "});\n");
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

  after( function () {
    sandbox.restore();
  });

  it("StepNameRequest should get back StepNameResponse with fileName and lineNumber", function (done) {
    var processor = new MessageProcessor({message: message, errorType: {values: {}}});
    processor.on("messageProcessed", function (response) {
      assert.deepEqual(stepNameRequest.messageId, response.messageId);
      assert.equal(message.MessageType.StepNameResponse, response.messageType);
      assert.equal(true, response.stepNameResponse.isStepPresent);
      done();
    });
    processor.getResponseFor(stepNameRequest);
  });

});
