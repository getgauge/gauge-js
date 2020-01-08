exports = module.exports;

exports.createStepNamesResponse = function (steps) {

  return {
    stepNamesResponse: {
      steps: steps
    }
  };

};

exports.createStepNameResponse = function () {

  return {
    stepNameResponse: {
      isStepPresent: false,
      stepName: [],
      hasAlias: false,
      fileName: "",
      span: {}
    }
  };

};

exports.createRefactorResponse = function () {

  return {
    refactorResponse: {
      success: false,
      error: "",
      filesChanged: [],
      fileChanges: []
    }
  };

};

exports.createStepValidateResponse = function (errorType, validated, suggestion) {

  if (validated.valid) {
    return {
      stepValidateResponse: {
        isValid: true
      }
    };
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

  return {
    stepValidateResponse: {
      isValid: false,
      errorType: errortype,
      errorMessage: errmsg,
      suggestion: suggestion
    }
  };
};

exports.createExecutionStatusResponse = function (isFailed, executionTime, err, msg, screenShot, recoverable, screenshots) {
  return {
    executionResult: {
      failed: isFailed,
      recoverableError: recoverable,
      executionTime: executionTime || 0,
      stackTrace: err && err.stack ? err.stack : "",
      errorMessage: err ? (err instanceof Error ? err.toString() : JSON.stringify(err)) : "",
      message: msg || [],
      screenShot: screenShot || "",
      failureScreenshot: screenShot || "",
      screenshots: screenshots || []
    }
  };

};

exports.createStepPositionsResponse = function (stepPositions) {

  return {
    stepPositionsResponse: {
      stepPositions: stepPositions,
      error: ""
    }
  };

};



exports.createImplementationFileListResponse = function (files) {
  return {
    implementationFileListResponse: {
      implementationFilePaths: files
    }
  };
};

exports.createImplementationFileGlobPatternResponse = function (globPatterns) {
  return {
    implementationFileGlobPatternResponse: {
      globPatterns: globPatterns
    }
  };
};

exports.createFileDiff = function () {

  return {
    fileDiff: {}
  };
};