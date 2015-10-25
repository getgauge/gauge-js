var assert = require('chai').assert;
var sinon  = require('sinon');
var ProtoBuf = require("protobufjs");
var builder = ProtoBuf.loadProtoFile("gauge-proto/messages.proto");
var message = builder.build("gauge.messages.Message");
require('../gauge-global');
var messageProcessor = require('../message-processor');

describe('Request Processing', function () {

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

    var request = new message({
      messageId: 1,
      messageType: message.MessageType.StepValidateRequest,
      stepValidateRequest: {
        stepText: 'A context step which gets executed before every scenario',
        numberOfParameters: 0
      }
    });

    messageProcessor.getResponseFor(request);

    assert(stepRegistry.exists.calledOnce);
    assert.equal('A context step which gets executed before every scenario', stepRegistry.exists.getCall(0).args[0]);
    done();

  });

  it('StepValidateRequest should get back StepValidateResponse with isValid set to true if the step exists', function (done) {

    var request = new message({
      messageId: 1,
      messageType: message.MessageType.StepValidateRequest,
      stepValidateRequest:{
        stepText: 'Say {} to {}',
        numberOfParameters: 0
      }
    });

    var response = messageProcessor.getResponseFor(request);

    assert.deepEqual(request.messageId, response.messageId);
    assert.equal(message.MessageType.StepValidateResponse, response.messageType);
    assert.equal(true, response.stepValidateResponse.isValid);

    done();

  });

  it('StepValidateRequest should get back StepValidateResponse with isValid set to false if the step doesn not exist', function (done) {

    var request = new message({
      messageId: 1,
      messageType: message.MessageType.StepValidateRequest,
      stepValidateRequest:{
        stepText: 'A context step which gets executed before every scenario',
        numberOfParameters: 0
      }
    });

    var response = messageProcessor.getResponseFor(request);

    assert.deepEqual(request.messageId, response.messageId);
    assert.equal(message.MessageType.StepValidateResponse, response.messageType);
    assert.equal(false, response.stepValidateResponse.isValid);

    done();

  });

});
