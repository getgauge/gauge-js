var assert = require('chai').assert;
var sinon  = require('sinon');
var ProtoBuf = require("protobufjs");
var builder = ProtoBuf.loadProtoFile("gauge-proto/messages.proto");
var message = builder.build("gauge.messages.Message");
require('../../lib/gauge-global');
var ExcecuteStepProcessor = require('../../lib/processor/ExecuteStepProcessor');
var Q = require('q');

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
    done();
  });

  after( function(done) {
    stepRegistry.get.restore();
    done();
  });

  it('Should execute the specified in the executeStepRequest', function(done) {
    var promise = ExcecuteStepProcessor(executeStepMessage);
    assert(stepRegistry.get.calledOnce);
    assert.equal('Say {} to {}', stepRegistry.get.getCall(0).args[0]);

    assert(stepImpl.calledOnce);
    assert.deepEqual(['hello', 'gauge'], stepImpl.getCall(0).args);

    promise.done(function(response) {
      assert.equal(1, response.messageId);
      done();
    });


  });

});
