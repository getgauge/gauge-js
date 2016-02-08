/* globals stepRegistry */
var expect = require("chai").expect;
var sinon  = require("sinon");
var ProtoBuf = require("protobufjs");
var builder = ProtoBuf.loadProtoFile("gauge-proto/messages.proto");
var Message = builder.build("gauge.messages.Message");
require("../src/gauge-global");
var executor = require("../src/executor");


describe("Executing steps", function() {

  var executeStepMessage = new Message({
    messageId: 1,
    messageType: Message.MessageType.ExecuteStep,
    executeStepRequest: {
      actualStepText: "Say \"hello\" to \"gauge\"",
      parsedStepText: "Say {} to {}",
      scenarioFailing: null,
      parameters: [
        { parameterType: 1, value: "hello", name: "", table: null },
        { parameterType: 1, value: "gauge", name: "", table: null }
      ]
    }
  });

  var executeStepMessageFailing = new Message({
    messageId: 1,
    messageType: Message.MessageType.ExecuteStep,
    executeStepRequest: {
      actualStepText: "failing test",
      parsedStepText: "failing test",
      scenarioFailing: null,
      parameters: []
    }
  });


  before( function(done) {
    stepRegistry.add("Say {} to {}", function() {});
    stepRegistry.add("failing test", function() {throw "Error";});
    sinon.spy(stepRegistry, "get");
    done();
  });

  after( function(done) {
    stepRegistry.get.restore();
    done();
  });

  it("Should resolve promise when test function passes", function(done) {
    var promise = executor.step(executeStepMessage);
    promise.then(
      function(value) {
        expect(value.executionStatusResponse.executionResult.failed).to.equal(false);
        done();
      }
    ).done();
  });

  it("Should reject the promise when test function fails", function(done) {
    var promise = executor.step(executeStepMessageFailing);
    promise.then(
      function() {},
      function(reason) {
        expect(reason.executionStatusResponse.executionResult.failed).to.equal(true);
        done();
      }
    ).done();
  });

});
