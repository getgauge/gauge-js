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
      self._emit(reason);
    }
  );
}

function executeBeforeSuiteHook(request) {
  stepRegistry.clear();
  impl_loader.load(GAUGE_PROJECT_ROOT);
  executeHook.apply(this, [request, "beforeSuite", request.executionStartingRequest.currentExecutionInfo]);
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

var getSuggestionFor = function (request, validated) {
  if (validated.reason !== "notfound") {
    return "";
  }
  return "step(\"" + request.stepValue.parameterizedStepValue + "\", async function(" + getParamsList(request.stepValue.parameters) + ") {\n\t" +
    "throw 'Unimplemented Step';\n" +
    "});";
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
    response.stepNameResponse.stepName.push(step.stepText);
    response.stepNameResponse.isStepPresent = true;
    response.stepNameResponse.fileName = step.fileLocations[0].filePath;
    response.stepNameResponse.lineNumber = step.fileLocations[0].line;
  }
  this._emit(response);
};

var executeStepPositionsRequest = function (request) {
  var response = factory.createStepPositionsResponse(this.options.message, request.messageId);
  var filepath = request.stepPositionsRequest.filePath;
  response.stepPositionsResponse.stepPositions = stepRegistry.getStepPositions(filepath);
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
};

MessageProcessor.prototype.getResponseFor = function (request) {
  this.processors[request.messageType].call(this, request);
};

MessageProcessor.prototype._emit = function (data) {
  this.emit("messageProcessed", data);
};

module.exports = MessageProcessor;
