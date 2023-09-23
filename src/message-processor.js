var fs = require("fs");
var path = require("path");

var config = require("../package.json").config || {};
var factory = require("./response-factory");
var stepRegistry = require("./step-registry");
var customMessageRegistry = require("./custom-message-registry");
var executor = require("./executor");
var refactor = require("./refactor");
var dataStore = require("./data-store-factory");
var impl_loader = require("./impl-loader");
var loader = require("./static-loader");
var inspector = require("inspector");
var fileUtil = require("./file-util");
var customScreenshotRegistry = require("./custom-screenshot-registry");
var logger = require("./logger");

const ATTACH_DEBUGGER_EVENT = "Runner Ready for Debugging";

var GAUGE_PROJECT_ROOT = process.env.GAUGE_PROJECT_ROOT;

var processCustomMessages = function (response) {
  var msgs = customMessageRegistry.get();
  response.executionResult.message = response.executionResult.message.concat(msgs);
  customMessageRegistry.clear();
  return response;
};

var processScreenshots = function (response) {
  var screenshotPromises = customScreenshotRegistry.get();
  return screenshotPromises.then(function (screenshotFiles) {
    response.executionResult.screenshotFiles = response.executionResult.screenshotFiles.concat(screenshotFiles);
    customScreenshotRegistry.clear();
  });
};

function executionResponse(isFailed, executionTime) {
  return factory.createExecutionStatusResponse(isFailed, executionTime);
}

function successExecutionStatus() {
  var response = executionResponse(false, 0);
  return response;
}

function executeStep(request, callback) {
  var promise = executor.step(request);
  promise.then(
    function (value) {
      callback(value);
    },
    function (reason) {
      callback(reason);
    }
  );
}

function executeHook(hookName, currentExecutionInfo, callback) {
  var promise = executor.hook(hookName, currentExecutionInfo);
  promise.then(
    function (response) {
      processCustomMessages(response);
      processScreenshots(response).then(function () {
        callback(response);
      });
    },
    function (reason) {
      processCustomMessages(reason);
      processScreenshots(reason).then(function () {
        callback(reason);
      });
    }
  );
}

function startExecution(executionStartingRequest, callback) {
  impl_loader.load(stepRegistry).then(() => {
    executeHook("beforeSuite", executionStartingRequest.currentExecutionInfo, callback);
  });
}

function executeBeforeSuiteHook(executionStartingRequest, callback) {
  if (process.env.DEBUGGING) {
    var port = parseInt(process.env.DEBUG_PORT);
    logger.info(ATTACH_DEBUGGER_EVENT);
    inspector.open(port, "127.0.0.1", true);
    var inspectorWaitTime = 1000;
    setTimeout(function () { startExecution(executionStartingRequest, callback); }, inspectorWaitTime);
  } else {
    startExecution(executionStartingRequest, callback);
  }
}

function executeBeforeSpecHook(specExecutionStartingRequest, callback) {
  executeHook("beforeSpec", specExecutionStartingRequest.currentExecutionInfo, callback);
}

function executeBeforeScenarioHook(scenarioExecutionStartingRequest, callback) {
  executeHook("beforeScenario", scenarioExecutionStartingRequest.currentExecutionInfo, callback);
}

function executeBeforeStepHook(stepExecutionStartingRequest, callback) {
  customMessageRegistry.clear();
  executeHook("beforeStep", stepExecutionStartingRequest.currentExecutionInfo, callback);
}

function executeAfterSuiteHook(executionEndingRequest, callback) {
  executeHook("afterSuite", executionEndingRequest.currentExecutionInfo, function (data) {
    dataStore.suiteStore.clear();
    callback(data);
  });
  if (process.env.DEBUGGING) {
    inspector.close();
  }
}

function executeAfterSpecHook(specExecutionEndingRequest, callback) {
  executeHook("afterSpec", specExecutionEndingRequest.currentExecutionInfo, function (data) {
    dataStore.specStore.clear();
    callback(data);
  });
}

function executeAfterScenarioHook(scenarioExecutionEndingRequest, callback) {
  executeHook("afterScenario", scenarioExecutionEndingRequest.currentExecutionInfo, function (data) {
    dataStore.scenarioStore.clear();
    callback(data);
  });
}

function executeAfterStepHook(stepExecutionEndingRequest, callback) {
  executeHook("afterStep", stepExecutionEndingRequest.currentExecutionInfo, callback);
}

var getParamsList = function (params) {
  return params.map(function (p, i) {
    return "arg" + i.toString();
  }).join(", ");
};

var generateImplStub = function (stepValue) {
  var argCount = 0;
  var stepText = stepValue.stepValue.replace(/{}/g, function () { return "<arg" + argCount++ + ">"; });
  return "step(\"" + stepText + "\", async function(" + getParamsList(stepValue.parameters) + ") {\n\t" +
    "throw 'Unimplemented Step';\n" +
    "});";
};

var getSuggestionFor = function (request, validated) {
  if (validated.reason !== "notfound") {
    return "";
  }
  return generateImplStub(request.stepValue);
};

var stepValidateResponse = function (stepValidateRequest, errorType) {
  var validated = stepRegistry.validate(stepValidateRequest.stepText);
  var suggestion = getSuggestionFor(stepValidateRequest, validated);
  var response = factory.createStepValidateResponse(errorType, validated, suggestion);
  return response;
};

var stepNamesResponse = function () {
  return factory.createStepNamesResponse(stepRegistry.getStepTexts());
};

var stepNameResponse = function (stepNameRequest) {
  var stepValue = stepNameRequest.stepValue;
  var response = factory.createStepNameResponse();
  var step = stepRegistry.get(stepValue);
  if (step) {
    response.stepNameResponse.stepName = step.aliases;
    response.stepNameResponse.hasAlias = step.hasAlias;
    response.stepNameResponse.isStepPresent = true;
    response.stepNameResponse.fileName = step.fileLocations[0].filePath;
    response.stepNameResponse.span = step.fileLocations[0].span;
  }
  return response;
};

var stepPositions = function (stepPositionsRequest) {
  var filepath = stepPositionsRequest.filePath;
  var response = factory.createStepPositionsResponse(stepRegistry.getStepPositions(filepath));
  return response;
};

var implementationFiles = function () {
  var response = factory.createImplementationFileListResponse(fileUtil.getListOfFiles());
  return response;
};

var implementStubResponse = function (stubImplementationCodeRequest) {
  var response = factory.createFileDiff();
  var filePath = stubImplementationCodeRequest.implementationFilePath;
  var codes = stubImplementationCodeRequest.codes;

  var reducer = function (accumulator, currentValue) {
    return accumulator + "\n" + currentValue;
  };
  var content = codes.reduce(reducer);

  var fileLineCount = 0;
  if (fs.existsSync(filePath)) {
    let fileContent = fs.readFileSync(filePath, "utf8").replace("\r\n", "\n");
    if (fileContent.trim().split("\n").length == fileContent.split("\n").length) {
      fileLineCount = fileContent.split("\n").length;
      content = "\n\n" + content;
    } else {
      fileLineCount = fileContent.split("\n").length;
      content = "\n" + content;
    }
  } else {
    filePath = fileUtil.getFileName(fileUtil.getImplDirs(GAUGE_PROJECT_ROOT)[0]);
  }

  var span = { start: fileLineCount, end: fileLineCount, startChar: 0, endChar: 0 };
  var textDiffs = [{ span: span, content: content }];
  response.fileDiff.filePath = filePath;
  response.fileDiff.textDiffs = textDiffs;
  return response;
};

var refactorResponse = function (request) {
  var response = factory.createRefactorResponse();
  response = refactor(request, response);
  return response;
};

var cacheFileResponse = function (cacheFileRequest, fileStatus) {
  const filePath = cacheFileRequest.filePath;
  if (!fileUtil.isJSFile(filePath) || !fileUtil.isInImplDir(filePath)) {
    return;
  }
  var CHANGED, OPENED, CLOSED, CREATED;
  if (config.hasPureJsGrpc) {
    CHANGED = fileStatus.values.CHANGED;
    OPENED = fileStatus.values.OPENED;
    CLOSED = fileStatus.values.CLOSED;
    CREATED = fileStatus.values.CREATED;
  } else {
    CHANGED = fileStatus.valuesById[fileStatus.values.CHANGED];
    OPENED = fileStatus.valuesById[fileStatus.values.OPENED];
    CLOSED = fileStatus.valuesById[fileStatus.values.CLOSED];
    CREATED = fileStatus.valuesById[fileStatus.values.CREATED];
  }
  if (cacheFileRequest.status === CREATED) {
    if (!stepRegistry.isFileCached(filePath)) {
      loader.reloadFile(filePath, fs.readFileSync(filePath, "utf8"));
    }
  } else if (cacheFileRequest.status === CHANGED || cacheFileRequest.status === OPENED || (
    cacheFileRequest.status === undefined && config.hasPureJsGrpc
  )) {
    loader.reloadFile(filePath, cacheFileRequest.content);
  } else if (cacheFileRequest.status === CLOSED &&
    fs.existsSync(filePath)) {
    loader.reloadFile(filePath, fs.readFileSync(filePath, "utf8"));
  } else {
    loader.unloadFile(filePath);
  }
};

var implementationGlobPatternResponse = function () {
  var globPatterns = [];
  fileUtil.getImplDirs().forEach((dir) => {
    globPatterns.push(dir.split(path.sep).join("/") + "/**/*.js");
  });
  var response = factory.createImplementationFileGlobPatternResponse(globPatterns);
  return response;
};

module.exports = {
  stepNamesResponse: stepNamesResponse,
  cacheFileResponse: cacheFileResponse,
  stepPositions: stepPositions,
  implementationFiles: implementationFiles,
  implementStubResponse: implementStubResponse,
  stepValidateResponse: stepValidateResponse,
  refactorResponse: refactorResponse,
  stepNameResponse: stepNameResponse,
  implementationGlobPatternResponse: implementationGlobPatternResponse,
  successExecutionStatus,
  executeBeforeSuiteHook,
  executeAfterSuiteHook,
  executeBeforeSpecHook,
  executeAfterSpecHook,
  executeBeforeScenarioHook,
  executeAfterScenarioHook,
  executeBeforeStepHook,
  executeAfterStepHook,
  executeStep
};
