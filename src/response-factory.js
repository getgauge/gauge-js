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

exports.createStepNameResponse = function (messageId) {

  return new Message({
    messageId: messageId,
    messageType: Message.MessageType.StepNameResponse,
    stepNameResponse: {
      isStepPresent: false,
      stepName: [],
      hasAlias: false
    }
  });

};

exports.createRefactorResponse = function (messageId) {

  return new Message({
    messageId: messageId,
    messageType: Message.MessageType.RefactorResponse,
    refactorResponse: {
      success: false,
      error: "",
      filesChanged: []
    }
  });

};

exports.createStepValidateResponse = function (messageId, validated) {

  if (validated.valid) {
    return new Message({
      messageId: messageId,
      messageType: Message.MessageType.StepValidateResponse,
      stepValidateResponse: {
        isValid: true
      }
    });
  }

  var errortype,
      errmsg = "Invalid step.";

  switch (validated.reason) {
  case "duplicate":
    errortype = errorType.DUPLICATE_STEP_IMPLEMENTATION;
    errmsg = "Duplicate step implementation found in file: " + validated.file;
    break;
  case "notfound":
    errortype = errorType.STEP_IMPLEMENTATION_NOT_FOUND;
    break;
  }

  return new Message({
    messageId: messageId,
    messageType: Message.MessageType.StepValidateResponse,
    stepValidateResponse: {
      isValid: false,
      errorType: errortype,
      errorMessage: errmsg
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
        message: msg || [],
        screenShot: null
      }
    }
  });

};
