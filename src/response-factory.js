var ProtoBuf = require("protobufjs");
var builder = ProtoBuf.loadProtoFile("gauge-proto/messages.proto");
var Message = builder.build("gauge.messages.Message");
var errorType = builder.build("gauge.messages.StepValidateResponse.ErrorType");

exports = module.exports;

exports.getStepNamesResponseMessage = function (messageId) {

  return new Message({
    messageId: messageId,
    messageType: Message.MessageType.StepNamesResponse,
    stepNamesResponse: {
      steps: []
    }
  });

};

exports.getStepValidateResponseMessage = function (messageId, isValid) {

  if (isValid) {
    return new Message({
      messageId: messageId,
      messageType: Message.MessageType.StepValidateResponse,
      stepValidateResponse: {
        isValid: true
      }
    });
  }
  return new Message({
    messageId: messageId,
    messageType: Message.MessageType.StepValidateResponse,
    stepValidateResponse: {
      isValid: false,
      errorType: errorType.STEP_IMPLEMENTATION_NOT_FOUND
    }
  });

};

exports.getExecutionStatusResponseMessage = function (messageId, isFailed, executionTime) {

  return new Message({
    messageId: messageId,
    messageType: Message.MessageType.ExecutionStatusResponse,
    executionStatusResponse: {
      executionResult: {
        failed: isFailed,
        executionTime: executionTime
      }
    }
  });

};
