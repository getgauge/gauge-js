var assert = require('chai').assert;
var ProtoBuf = require("protobufjs");
var MessageProcessor = require('../message-processor');
var builder = ProtoBuf.loadProtoFile("gauge-proto/messages.proto");
var message = builder.build("gauge.messages.Message");

describe('Request Processing', function () {

    it('StepValidateRequest should get back StepValidateResponse', function (done) {
        var request = new message({
            messageId: 1,
            messageType: message.MessageType.StepValidateRequest,
            stepValidateRequest:{
                stepText: 'A context step which gets executed before every scenario',
                numberOfParameters: 0
            }
        });

        var response = MessageProcessor.getResponseFor(request);
        assert.deepEqual(request.messageId, response.messageId);
        assert.equal(response.messageType, message.MessageType.StepValidateResponse);

        done();
    });

});


