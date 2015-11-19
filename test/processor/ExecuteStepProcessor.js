var assert = require('chai').assert;
var sinon  = require('sinon');
var ProtoBuf = require("protobufjs");
var builder = ProtoBuf.loadProtoFile("gauge-proto/messages.proto");
var message = builder.build("gauge.messages.Message");
require('../../src/gauge-global');
var ExcecuteStepProcessor = require('../../src/processor/ExecuteStepProcessor');
var Q = require('q');
var StepExecutor = require('../../src/step-executor');

describe('Processing Excecute Step Request', function() {

  var executeStepMessage = new message({
    messageId: 1,
    messageType: message.MessageType.ExecuteStep,
    executeStepRequest: {
      actualStepText: 'Say "hello" to "gauge"',
      parsedStepText: 'Say {} to {}',
      scenarioFailing: null,
      parameters: [
        { parameterType: 1, value: 'hello', name: '', table: null },
        { parameterType: 1, value: 'gauge', name: '', table: null }
      ]
    }
  });

  var stepImpl = sinon.spy();

  before( function(done) {
    stepRegistry.add('Say {} to {}', stepImpl);
    sinon.spy(stepRegistry, 'get');
    sinon.spy(StepExecutor, 'execute');
    done();
  });

  after( function(done) {
    stepRegistry.get.restore();
    StepExecutor.execute.restore();
    done();
  });

  it('Should call step-executor to run the function and get the callback', function() {
    var promise = ExcecuteStepProcessor(executeStepMessage);
    assert(StepExecutor.execute.calledOnce);
    assert.deepEqual(stepImpl, StepExecutor.execute.getCall(0).args[0]);
    assert.deepEqual(['hello', 'gauge'], StepExecutor.execute.getCall(0).args[1]);
  });

  // it('Should resolve promise with ExecutionStatusResponse when test finishes', function() {
  //
  //   var promise = ExcecuteStepProcessor(executeStepMessage);
  //
  //   promise.done(function(response) {
  //     console.log(response);
  //   });
  //
  //
  // });

  // it('Should execute the specified step in the executeStepRequest', function(done) {
  //   var promise = ExcecuteStepProcessor(executeStepMessage);
  //   assert(stepRegistry.get.calledOnce);
  //   assert.equal('Say {} to {}', stepRegistry.get.getCall(0).args[0]);
  //
  //   assert(stepImpl.calledOnce);
  //   assert.deepEqual(['hello', 'gauge'], stepImpl.getCall(0).args);
  //
  //   promise.done(function(response) {
  //     assert.equal(1, response.messageId);
  //     done();
  //   });
  // });

});
