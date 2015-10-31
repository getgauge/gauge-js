var assert = require('chai').assert;
var sinon  = require('sinon');
var ProtoBuf = require("protobufjs");
var builder = ProtoBuf.loadProtoFile("gauge-proto/messages.proto");
var message = builder.build("gauge.messages.Message");
require('../lib/gauge-global');
var messageProcessor = require('../lib/message-processor');

describe('Request Processing', function () {

  var stepValidateRequest = [
    new message({
      messageId: 1,
      messageType: message.MessageType.StepValidateRequest,
      stepValidateRequest: {
        stepText: 'A context step which gets executed before every scenario',
        numberOfParameters: 0
      }
    }),
    new message({
      messageId: 1,
      messageType: message.MessageType.StepValidateRequest,
      stepValidateRequest:{
        stepText: 'Say {} to {}',
        numberOfParameters: 0
      }
    })
  ];


  before( function(done) {
    stepRegistry.add('Say {} to {}', function(){});
    sinon.spy(stepRegistry, 'exists');
    done();
  });

  after( function(done) {
    stepRegistry.exists.restore();
    done();
  });

  it('Should check if step exists in step registry when a StepValidateRequest is received', function(done) {

    messageProcessor.getResponseFor(stepValidateRequest[0]);

    assert(stepRegistry.exists.calledOnce);
    assert.equal('A context step which gets executed before every scenario', stepRegistry.exists.getCall(0).args[0]);
    done();

  });

  it('StepValidateRequest should get back StepValidateResponse with isValid set to true if the step exists', function (done) {

    var response = messageProcessor.getResponseFor(stepValidateRequest[1]);

    assert.deepEqual(stepValidateRequest[1].messageId, response.messageId);
    assert.equal(message.MessageType.StepValidateResponse, response.messageType);
    assert.equal(true, response.stepValidateResponse.isValid);

    done();

  });

  it('StepValidateRequest should get back StepValidateResponse with isValid set to false if the step doesn not exist', function (done) {

    var response = messageProcessor.getResponseFor(stepValidateRequest[0]);

    assert.deepEqual(stepValidateRequest[0].messageId, response.messageId);
    assert.equal(message.MessageType.StepValidateResponse, response.messageType);
    assert.equal(false, response.stepValidateResponse.isValid);

    done();

  });

});
