/* globals stepRegistry */
var assert = require("chai").assert;
var sinon  = require("sinon");
var ProtoBuf = require("protobufjs");
var builder = ProtoBuf.loadProtoFile("gauge-proto/messages.proto");
var Message = builder.build("gauge.messages.Message");
require("../src/gauge-global");
var messageProcessor = require("../src/message-processor");

describe("Request Processing", function () {

  var stepValidateRequest = [
    new Message({
      messageId: 1,
      messageType: Message.MessageType.StepValidateRequest,
      stepValidateRequest: {
        stepText: "A context step which gets executed before every scenario",
        numberOfParameters: 0
      }
    }),
    new Message({
      messageId: 1,
      messageType: Message.MessageType.StepValidateRequest,
      stepValidateRequest:{
        stepText: "Say {} to {}",
        numberOfParameters: 0
      }
    })
  ];


  before( function() {
    stepRegistry.add("Say {} to {}", function(){});
    sinon.spy(stepRegistry, "exists");
  });

  after( function() {
    stepRegistry.exists.restore();
  });

  beforeEach( function() {
    messageProcessor.removeAllListeners("messageProcessed");
  });

  it("Should check if step exists in step registry when a StepValidateRequest is received", function(done) {

    messageProcessor.getResponseFor(stepValidateRequest[0]);

    assert(stepRegistry.exists.calledOnce);
    assert.equal("A context step which gets executed before every scenario", stepRegistry.exists.getCall(0).args[0]);
    done();

  });

  it("StepValidateRequest should get back StepValidateResponse with isValid set to true if the step exists", function (done) {
    messageProcessor.on("messageProcessed", function(response) {
      assert.deepEqual(stepValidateRequest[1].messageId, response.messageId);
      assert.equal(Message.MessageType.StepValidateResponse, response.messageType);
      assert.equal(true, response.stepValidateResponse.isValid);
      done();
    });
    messageProcessor.getResponseFor(stepValidateRequest[1]);
  });

  it("StepValidateRequest should get back StepValidateResponse with isValid set to false if the step does not exist", function (done) {
    messageProcessor.on("messageProcessed", function(response) {
      assert.deepEqual(stepValidateRequest[0].messageId, response.messageId);
      assert.equal(Message.MessageType.StepValidateResponse, response.messageType);
      assert.equal(false, response.stepValidateResponse.isValid);
      done();
    });
    messageProcessor.getResponseFor(stepValidateRequest[0]);
  });

});
