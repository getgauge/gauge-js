export const createStepNamesResponse = function (steps) {

  return {
    stepNamesResponse: {
      steps: steps
    }
  };

};

export const createStepNameResponse = function () {

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

export const createRefactorResponse = function () {

  return {
    refactorResponse: {
      success: false,
      error: "",
      filesChanged: [],
      fileChanges: []
    }
  };

};

export const createStepValidateResponse = function (errorType, validated, suggestion) {

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

export const createExecutionStatusResponse = function (isFailed, executionTime, err, msg, failureScreenshotFile, recoverable, screenshotFiles) {
  return {
    executionResult: {
      failed: isFailed,
      recoverableError: recoverable,
      executionTime: executionTime || 0,
      stackTrace: err && err.stack ? err.stack : "",
      errorMessage: err ? (err instanceof Error ? err.toString() : JSON.stringify(err)) : "",
      message: msg || [],
      failureScreenshotFile: failureScreenshotFile || "",
      screenshotFiles: screenshotFiles || []
    }
  };

};

export const createStepPositionsResponse = function (stepPositions) {

  return {
    stepPositionsResponse: {
      stepPositions: stepPositions,
      error: ""
    }
  };

};

export const createImplementationFileListResponse = function (files) {
  return {
    implementationFileListResponse: {
      implementationFilePaths: files
    }
  };
};

export const createImplementationFileGlobPatternResponse = function (globPatterns) {
  return {
    implementationFileGlobPatternResponse: {
      globPatterns: globPatterns
    }
  };
};

export const createFileDiff = function () {

  return {
    fileDiff: {}
  };
};

export default { createStepNamesResponse, createStepNameResponse, createRefactorResponse, createStepValidateResponse, createExecutionStatusResponse, createStepPositionsResponse, createImplementationFileListResponse, createImplementationFileGlobPatternResponse, createFileDiff };
