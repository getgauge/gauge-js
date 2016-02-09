var ProtoBuf = require("protobufjs");
var builder = ProtoBuf.loadProtoFile("gauge-proto/messages.proto");
var Message = builder.build("gauge.messages.Message");
var errorType = builder.build("gauge.messages.StepValidateResponse.ErrorType");

exports = module.exports;

exports.createStepNamesResponse = function (messageId) {

  return new Message({
    messageId: messageId,
    messageType: Message.MessageType.StepNamesResponse,
    stepNamesResponse: {
      steps: []
    }
  });

};

exports.createStepValidateResponse = function (messageId, isValid) {

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

exports.createExecutionStatusResponse = function (messageId, isFailed, executionTime, err, msg) {

  return new Message({
    messageId: messageId,
    messageType: Message.MessageType.ExecutionStatusResponse,
    executionStatusResponse: {
      executionResult: {
        failed: isFailed,
        executionTime: executionTime || 0,
        stackTrace: err && err.stack ? err.stack : null,
        errorMessage: err ? err.toString() : null,
        message: msg || []
      }
    }
  });

};
