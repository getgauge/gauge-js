var ProtoBuf = require("protobufjs");
var ByteBuffer = ProtoBuf.ByteBuffer;
var builder = ProtoBuf.loadProtoFile("./gauge-proto/messages.proto");
var message = builder.build("gauge.messages.Message");
var errorType = builder.build("gauge.messages.StepValidateResponse.ErrorType");

exports = module.exports;

exports.getStepNamesResponseMessage = function (messageId) {

  return new message({
    messageId: messageId,
    messageType: message.MessageType.StepNamesResponse,
    stepNamesResponse: {
      steps: []
    }
  });

};

exports.getStepValidateResponseMessage = function (messageId, isValid) {

  return isValid
  ?
  new message({
    messageId: messageId,
    messageType: message.MessageType.StepValidateResponse,
    stepValidateResponse: {
      isValid: true
    }
  })
  :
  new message({
    messageId: messageId,
    messageType: message.MessageType.StepValidateResponse,
    stepValidateResponse: {
      isValid: false,
      errorType: errorType.STEP_IMPLEMENTATION_NOT_FOUND
    }
  });

};

exports.getExecutionStatusResponseMessage = function (messageId, isFailed, executionTime) {

  return new message({
    messageId: messageId,
    messageType: message.MessageType.ExecutionStatusResponse,
    executionStatusResponse: {
      executionResult: {
        failed: isFailed,
        executionTime: executionTime
      }
    }
  });

}
