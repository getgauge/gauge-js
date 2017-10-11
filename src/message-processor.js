var factory = require("./response-factory");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var stepRegistry = require("./step-registry");
var customMessageRegistry = require("./custom-message-registry");
var executor = require("./executor");
var refactor = require("./refactor");
var dataStore = require("./data-store-factory");
var esprima = require("esprima");
var estraverse = require("estraverse");
var fs = require("fs");

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

function executeStep (request) {
  var self = this;
  var promise = executor.step(request, this.options.message);
  promise.then(
    function(value) {
      self._emit(value);
    },
    function(reason) {
      self._emit(reason);
    }
  );
}

function executeHook (request, hookName, currentExecutionInfo) {
  var self = this;
  var promise = executor.hook(request, this.options.message, hookName, currentExecutionInfo);
  promise.then(
    function(response) {
      response = processCustomMessages(response);
      self._emit(response);
    },
    function(reason) {
      self._emit(reason);
    }
  );
}

function executeBeforeSuiteHook (request) {
  executeHook.apply(this, [request, "beforeSuite", request.executionStartingRequest.currentExecutionInfo]);
}

function executeBeforeSpecHook (request) {
  executeHook.apply(this, [request, "beforeSpec", request.specExecutionStartingRequest.currentExecutionInfo]);
}

function executeBeforeScenarioHook (request) {
  executeHook.apply(this, [request, "beforeScenario", request.scenarioExecutionStartingRequest.currentExecutionInfo]);
}

function executeBeforeStepHook (request) {
  customMessageRegistry.clear();
  executeHook.apply(this, [request, "beforeStep", request.stepExecutionStartingRequest.currentExecutionInfo]);
}

function executeAfterSuiteHook (request) {
  dataStore.suiteStore.clear();
  executeHook.apply(this, [request, "afterSuite", request.executionEndingRequest.currentExecutionInfo]);
}

function executeAfterSpecHook (request) {
  dataStore.specStore.clear();
  executeHook.apply(this, [request, "afterSpec", request.specExecutionEndingRequest.currentExecutionInfo]);
}

function executeAfterScenarioHook (request) {
  dataStore.scenarioStore.clear();
  executeHook.apply(this, [request, "afterScenario", request.scenarioExecutionEndingRequest.currentExecutionInfo]);
}

function executeAfterStepHook (request) {
  executeHook.apply(this, [request, "afterStep", request.stepExecutionEndingRequest.currentExecutionInfo]);
}

function validateStep(request) {
  var validated = stepRegistry.validate(request.stepValidateRequest.stepText);
  var response = factory.createStepValidateResponse(this.options.message, request.messageId, this.options.errorType, validated);
  this._emit(response);
}

var executeStepNamesRequest = function (request) {
  var response = factory.createStepNamesResponse(this.options.message, request.messageId);
  response.stepNamesResponse.steps = response.stepNamesResponse.steps.concat(stepRegistry.getStepTexts());
  this._emit(response);
};

var isStepNode = function(node) {
  var isGaugeStepFunction = function(node) {
    return node.callee.object && node.callee.object.name === "gauge" && node.callee.property && node.callee.property.name === "step";
  };
  var isGlobalStepFunction = function(node) {
    return node.callee && node.callee.name === "step";
  };
  return (node.type === "CallExpression" && (isGaugeStepFunction(node) || isGlobalStepFunction(node)));
};

var executeStepNameRequest = function (request) {
  var stepValue = request.stepNameRequest.stepValue;
  var response = factory.createStepNameResponse(this.options.message, request.messageId);
  if (stepRegistry.exists(stepValue)) {
    var step = stepRegistry.get(stepValue);
    response.stepNameResponse.stepName.push(step.stepText);
    response.stepNameResponse.isStepPresent = true;
    response.stepNameResponse.fileName = step.filePath;
    var content = fs.readFileSync(step.filePath).toString("utf-8");
    var ast = esprima.parse(content, { loc: true });
    estraverse.traverse(ast, {
      enter: function (node) {
        if (isStepNode(node) && node.arguments[0].value === step.stepText) {
          response.stepNameResponse.lineNumber = node.loc.start.line;
          this.break();
        }
      }
    });
  }
  this._emit(response);
};

var executeRefactor = function (request) {
  var response = factory.createRefactorResponse(this.options.message, request.messageId);
  response = refactor(request, response);
  this._emit(response);
};

function killProcess() {
  process.exit();
}

var MessageProcessor = function(protoOptions) {
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
  this.processors[this.options.message.MessageType.KillProcessRequest] = killProcess;
};

MessageProcessor.prototype.getResponseFor = function(request){
  this.processors[request.messageType].call(this, request);
};

MessageProcessor.prototype._emit = function(data) {
  this.emit("messageProcessed", data);
};

module.exports = MessageProcessor;
