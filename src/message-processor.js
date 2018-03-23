var fs = require("fs");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

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

const ATTACH_DEBUGGER_EVENT = "Runner Ready for Debugging";

var GAUGE_PROJECT_ROOT = process.env.GAUGE_PROJECT_ROOT;

var processCustomMessages = function (response) {
  var msgs = customMessageRegistry.get();
  response.executionStatusResponse.executionResult.message = response.executionStatusResponse.executionResult.message.concat(msgs);
  customMessageRegistry.clear();
  return response;
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
      response = processCustomMessages(response);
      self._emit(response);
    },
    function (reason) {
      processCustomMessages(reason);
      self._emit(reason);
    }
  );
}

function startExecution(self, request) {
  impl_loader.load(GAUGE_PROJECT_ROOT);
  executeHook.apply(self, [request, "beforeSuite", request.executionStartingRequest.currentExecutionInfo]);
}

function executeBeforeSuiteHook(request) {
  stepRegistry.clear();
  var self = this;
  if (process.env.DEBUGGING) {
    var port = parseInt(process.env.DEBUG_PORT);
    console.log(ATTACH_DEBUGGER_EVENT);
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

function validateStep(request) {
  var validated = stepRegistry.validate(request.stepValidateRequest.stepText);
  var suggestion = getSuggestionFor(request.stepValidateRequest, validated);
  var response = factory.createStepValidateResponse(this.options.message, request.messageId, this.options.errorType, validated, suggestion);
  this._emit(response);
}

var executeStepNamesRequest = function (request) {
  var response = factory.createStepNamesResponse(this.options.message, request.messageId);
  response.stepNamesResponse.steps = response.stepNamesResponse.steps.concat(stepRegistry.getStepTexts());
  this._emit(response);
};

var executeStepNameRequest = function (request) {
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
  this._emit(response);
};

var executeStepPositionsRequest = function (request) {
  var response = factory.createStepPositionsResponse(this.options.message, request.messageId);
  var filepath = request.stepPositionsRequest.filePath;
  response.stepPositionsResponse.stepPositions = stepRegistry.getStepPositions(filepath);
  this._emit(response);
};

var getImplementationFiles = function (request) {
  var response = factory.createImplementationFileListResponse(this.options.message, request.messageId);
  var files = fileUtil.getListOfFiles(GAUGE_PROJECT_ROOT);
  response.implementationFileListResponse.implementationFilePaths = files;
  this._emit(response);
};

var putStubImplementationCode = function (request) {
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
  this._emit(response);
};

var executeRefactor = function (request) {
  var response = factory.createRefactorResponse(this.options.message, request.messageId);
  response = refactor(request, response);
  this._emit(response);
};

var executeCacheFileRequest = function (request) {
  if (!request.cacheFileRequest.isClosed) {
    loader.reloadFile(request.cacheFileRequest.filePath, request.cacheFileRequest.content);
  } else {
    if (fs.existsSync(request.cacheFileRequest.filePath)) {
      loader.reloadFile(request.cacheFileRequest.filePath, fs.readFileSync(request.cacheFileRequest.filePath, "UTF-8"));
    } else {
      loader.unloadFile(request.cacheFileRequest.filePath);
    }
  }
};

function killProcess() {
  process.exit();
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
  this.processors[this.options.message.MessageType.StubImplementationCodeRequest] = putStubImplementationCode;
};

MessageProcessor.prototype.getResponseFor = function (request) {
  this.processors[request.messageType].call(this, request);
};

MessageProcessor.prototype._emit = function (data) {
  this.emit("messageProcessed", data);
};

module.exports = MessageProcessor;
