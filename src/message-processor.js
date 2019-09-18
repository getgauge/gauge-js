var fs = require("fs");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
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
  response.executionStatusResponse.executionResult.message = response.executionStatusResponse.executionResult.message.concat(msgs);
  customMessageRegistry.clear();
  return response;
};

var processScreenshots = function (response) {
  var screenshotPromises = customScreenshotRegistry.get();
  return screenshotPromises.then(function (screenshots) {
    response.executionStatusResponse.executionResult.screenshots = response.executionStatusResponse.executionResult.screenshots.concat(screenshots);
    customScreenshotRegistry.clear();
  });
};

function executionResponse(message, isFailed, executionTime, messageId) {
  return factory.createExecutionStatusResponse(message, messageId, isFailed, executionTime);
}

function successExecutionStatus(request) {
  var response = executionResponse(this.options.message, false, 0, request.messageId);
  this._emit(response);
}

function executeStep(request) {
  var self = this;
  var promise = executor.step(request, this.options.message);
  promise.then(
    function (value) {
      self._emit(value);
    },
    function (reason) {
      self._emit(reason);
    }
  );
}

function executeHook(request, hookName, currentExecutionInfo) {
  var self = this;
  var promise = executor.hook(request, this.options.message, hookName, currentExecutionInfo);
  promise.then(
    function (response) {
      processCustomMessages(response);
      processScreenshots(response).then(function () {
        self._emit(response);
      });
    },
    function (reason) {
      processCustomMessages(reason);
      processScreenshots(reason).then(function () {
        self._emit(reason);
      });
    }
  );
}

function startExecution(self, request) {
  impl_loader.load(stepRegistry).then(() => {
    executeHook.apply(self, [request, "beforeSuite", request.executionStartingRequest.currentExecutionInfo]); 
  });
}

function executeBeforeSuiteHook(request) {
  var self = this;
  if (process.env.DEBUGGING) {
    var port = parseInt(process.env.DEBUG_PORT);
    logger.info(ATTACH_DEBUGGER_EVENT);
    inspector.open(port, "127.0.0.1", true);
    var inspectorWaitTime = 1000;
    setTimeout(function () { startExecution(self, request); }, inspectorWaitTime);
  } else {
    startExecution(self, request);
  }
}

function executeBeforeSpecHook(request) {
  executeHook.apply(this, [request, "beforeSpec", request.specExecutionStartingRequest.currentExecutionInfo]);
}

function executeBeforeScenarioHook(request) {
  executeHook.apply(this, [request, "beforeScenario", request.scenarioExecutionStartingRequest.currentExecutionInfo]);
}

function executeBeforeStepHook(request) {
  customMessageRegistry.clear();
  executeHook.apply(this, [request, "beforeStep", request.stepExecutionStartingRequest.currentExecutionInfo]);
}

function executeAfterSuiteHook(request) {
  dataStore.suiteStore.clear();
  executeHook.apply(this, [request, "afterSuite", request.executionEndingRequest.currentExecutionInfo]);
  if (process.env.DEBUGGING) {
    inspector.close();
  }
}

function executeAfterSpecHook(request) {
  dataStore.specStore.clear();
  executeHook.apply(this, [request, "afterSpec", request.specExecutionEndingRequest.currentExecutionInfo]);
}

function executeAfterScenarioHook(request) {
  dataStore.scenarioStore.clear();
  executeHook.apply(this, [request, "afterScenario", request.scenarioExecutionEndingRequest.currentExecutionInfo]);
}

function executeAfterStepHook(request) {
  executeHook.apply(this, [request, "afterStep", request.stepExecutionEndingRequest.currentExecutionInfo]);
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

var stepValidateResponse = function (request) {
  var validated = stepRegistry.validate(request.stepValidateRequest.stepText);
  var suggestion = getSuggestionFor(request.stepValidateRequest, validated);
  var response = factory.createStepValidateResponse(this.options.message, request.messageId, this.options.errorType, validated, suggestion);
  return response;
};

var validateStep = function (request) {
  this._emit(stepValidateResponse.call(this, request));
};

var stepNamesResponse = function (request) {
  var response = factory.createStepNamesResponse(this.options.message, request.messageId);
  response.stepNamesResponse.steps = response.stepNamesResponse.steps.concat(stepRegistry.getStepTexts());
  return response;
};

var executeStepNamesRequest = function (request) {
  this._emit(stepNamesResponse.call(this, request));
};

var stepNameResponse = function (request) {
  var stepValue = request.stepNameRequest.stepValue;
  var response = factory.createStepNameResponse(this.options.message, request.messageId);
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

var executeStepNameRequest = function (request) {
  this._emit(stepNameResponse.call(this, request));
};

var stepPositions = function (request) {
  var response = factory.createStepPositionsResponse(this.options.message, request.messageId);
  var filepath = request.stepPositionsRequest.filePath;
  response.stepPositionsResponse.stepPositions = stepRegistry.getStepPositions(filepath);
  return response;
};

var executeStepPositionsRequest = function (request) {
  this._emit(stepPositions.call(this, request));
};

var implementationFiles = function (request) {
  var response = factory.createImplementationFileListResponse(this.options.message, request.messageId);
  var files = fileUtil.getListOfFiles();
  response.implementationFileListResponse.implementationFilePaths = files;
  return response;
};

var getImplementationFiles = function (request) {
  this._emit(implementationFiles.call(this, request));
};

var implementStubResponse = function (request) {
  var response = factory.createFileDiff(this.options.message, request.messageId);
  var filePath = request.stubImplementationCodeRequest.implementationFilePath;
  var codes = request.stubImplementationCodeRequest.codes;

  var reducer = function (accumulator, currentValue) {
    return accumulator + "\n" + currentValue;
  };
  var content = codes.reduce(reducer);

  var fileLineCount = 0;
  if (fs.existsSync(filePath)) {
    let fileContent = fs.readFileSync(filePath, "utf8").toString().replace("\r\n", "\n");
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

var putStubImplementationCode = function (request) {
  this._emit(implementStubResponse.call(this, request));
};

var refactorResponse = function (request) {
  var response = factory.createRefactorResponse(this.options.message, request.messageId);
  response = refactor(request, response);
  return response;
};

var executeRefactor = function (request) {
  this._emit(refactorResponse.call(this, request));
};

var cacheFileResponse = function (request) {
  const filePath = request.cacheFileRequest.filePath;
  if (!fileUtil.isJSFile(filePath) || !fileUtil.isInImplDir(filePath)) {
    return;
  }
  var CHANGED,OPENED,CLOSED, CREATED;
  if(config.hasPureJsGrpc) {
    CHANGED = this.options.fileStatus.values.CHANGED;
    OPENED = this.options.fileStatus.values.OPENED;
    CLOSED = this.options.fileStatus.values.CLOSED;
    CREATED = this.options.fileStatus.values.CREATED;
  } else {
    CHANGED = this.options.fileStatus.valuesById[this.options.fileStatus.values.CHANGED];
    OPENED = this.options.fileStatus.valuesById[this.options.fileStatus.values.OPENED];
    CLOSED = this.options.fileStatus.valuesById[this.options.fileStatus.values.CLOSED];
    CREATED = this.options.fileStatus.valuesById[this.options.fileStatus.values.CREATED];
  }
  if (request.cacheFileRequest.status === CREATED) {
    if (!stepRegistry.isFileCached(filePath)) {
      loader.reloadFile(filePath, fs.readFileSync(filePath, "UTF-8"));
    }
  } else if ( request.cacheFileRequest.status === CHANGED || request.cacheFileRequest.status === OPENED || (
    request.cacheFileRequest.status === undefined && config.hasPureJsGrpc
  )) {
    loader.reloadFile(filePath, request.cacheFileRequest.content);
  } else if (request.cacheFileRequest.status === CLOSED &&
    fs.existsSync(filePath)) {
    loader.reloadFile(filePath, fs.readFileSync(filePath, "UTF-8"));
  } else {
    loader.unloadFile(filePath);
  }
};

var executeCacheFileRequest = function (request) {
  cacheFileResponse.call(this, request);
};

var implementationGlobPatternResponse = function (request) {
  var response = factory.createImplementationFileGlobPatternResponse(this.options.message, request.messageId);
  var globPatterns = [];
  fileUtil.getImplDirs().forEach((dir) => {
    globPatterns.push(dir.split(path.sep).join("/") + "/**/*.js");
  });
  response.implementationFileGlobPatternResponse.globPatterns = globPatterns;
  return response;
};

var getImplementationFileGlobPatterns = function (request) {
  this._emit(implementationGlobPatternResponse.call(this, request));
};

function killProcess() {
  this.emit("closeSocket");
}

var MessageProcessor = function (protoOptions) {
  EventEmitter.call(this);
  util.inherits(MessageProcessor, EventEmitter);
  this.processors = {};
  this.options = protoOptions;
  this.processors[this.options.message.MessageType.StepNamesRequest] = executeStepNamesRequest;
  this.processors[this.options.message.MessageType.StepNameRequest] = executeStepNameRequest;
  this.processors[this.options.message.MessageType.RefactorRequest] = executeRefactor;
  this.processors[this.options.message.MessageType.StepValidateRequest] = validateStep;
  this.processors[this.options.message.MessageType.SuiteDataStoreInit] = successExecutionStatus;
  this.processors[this.options.message.MessageType.SpecDataStoreInit] = successExecutionStatus;
  this.processors[this.options.message.MessageType.SpecExecutionStarting] = executeBeforeSpecHook;
  this.processors[this.options.message.MessageType.ScenarioDataStoreInit] = successExecutionStatus;
  this.processors[this.options.message.MessageType.ScenarioExecutionStarting] = executeBeforeScenarioHook;
  this.processors[this.options.message.MessageType.StepExecutionStarting] = executeBeforeStepHook;
  this.processors[this.options.message.MessageType.StepExecutionEnding] = executeAfterStepHook;
  this.processors[this.options.message.MessageType.ScenarioExecutionEnding] = executeAfterScenarioHook;
  this.processors[this.options.message.MessageType.SpecExecutionEnding] = executeAfterSpecHook;
  this.processors[this.options.message.MessageType.ExecutionStarting] = executeBeforeSuiteHook;
  this.processors[this.options.message.MessageType.ExecutionEnding] = executeAfterSuiteHook;
  this.processors[this.options.message.MessageType.ExecuteStep] = executeStep;
  this.processors[this.options.message.MessageType.CacheFileRequest] = executeCacheFileRequest;
  this.processors[this.options.message.MessageType.StepPositionsRequest] = executeStepPositionsRequest;
  this.processors[this.options.message.MessageType.KillProcessRequest] = killProcess;
  this.processors[this.options.message.MessageType.ImplementationFileListRequest] = getImplementationFiles;
  this.processors[this.options.message.MessageType.ImplementationFileGlobPatternRequest] = getImplementationFileGlobPatterns;
  this.processors[this.options.message.MessageType.StubImplementationCodeRequest] = putStubImplementationCode;
};

MessageProcessor.prototype.getResponseFor = function (request) {
  this.processors[request.messageType].call(this, request);
};

MessageProcessor.prototype._emit = function (data) {
  this.emit("messageProcessed", data);
};

module.exports = {
  MessageProcessor: MessageProcessor,
  stepNamesResponse: stepNamesResponse,
  cacheFileResponse: cacheFileResponse,
  stepPositions: stepPositions,
  implementationFiles: implementationFiles,
  implementStubResponse: implementStubResponse,
  stepValidateResponse: stepValidateResponse,
  refactorResponse: refactorResponse,
  stepNameResponse: stepNameResponse,
  implementationGlobPatternResponse: implementationGlobPatternResponse
};