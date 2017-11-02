exports = module.exports;

exports.createStepNamesResponse = function (message, messageId) {

  return message.create({
    messageId: messageId,
    messageType: message.MessageType.StepNamesResponse,
    stepNamesResponse: {
      steps: []
    }
  });

};

exports.createStepNameResponse = function (message, messageId) {

  return message.create({
    messageId: messageId,
    messageType: message.MessageType.StepNameResponse,
    stepNameResponse: {
      isStepPresent: false,
      stepName: [],
      hasAlias: false,
      fileName: "",
      lineNumber: -1
    }
  });

};

exports.createRefactorResponse = function (message, messageId) {

  return message.create({
    messageId: messageId,
    messageType: message.MessageType.RefactorResponse,
    refactorResponse: {
      success: false,
      error: "",
      filesChanged: []
    }
  });

};

exports.createStepValidateResponse = function (message, messageId, errorType, validated) {

  if (validated.valid) {
    return message.create({
      messageId: messageId,
      messageType: message.MessageType.StepValidateResponse,
      stepValidateResponse: {
        isValid: true
      }
    });
  }

  var errortype,
      errmsg = "Invalid step.";

  switch (validated.reason) {
    case "duplicate":
      errortype = errorType.values.DUPLICATE_STEP_IMPLEMENTATION;
      errmsg = "Duplicate step implementation found in file: " + validated.file;
      break;
    case "notfound":
      errortype = errorType.values.STEP_IMPLEMENTATION_NOT_FOUND;
      break;
  }

  return message.create({
    messageId: messageId,
    messageType: message.MessageType.StepValidateResponse,
    stepValidateResponse: {
      isValid: false,
      errorType: errortype,
      errorMessage: errmsg
    }
  });

};

exports.createExecutionStatusResponse = function (message, messageId, isFailed, executionTime, err, msg, recoverable) {

  return message.create({
    messageId: messageId,
    messageType: message.MessageType.ExecutionStatusResponse,
    executionStatusResponse: {
      executionResult: {
        failed: isFailed,
        recoverableError: recoverable,
        executionTime: executionTime || 0,
        stackTrace: err && err.stack ? err.stack : "",
        errorMessage: err ? err.toString() : "",
        message: msg || []
      }
    }
  });

};

exports.createStepPositionsResponse = function (message, messageId) {

  return message.create({
    messageId: messageId,
    messageType: message.MessageType.StepPositionsResponse,
    stepPositionsResponse: {
      stepPositions: [],
      error: ""
    }
  });

};
