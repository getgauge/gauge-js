/* globals stepRegistry */
var ProtoBuf = require("protobufjs");
var builder = ProtoBuf.loadProtoFile("gauge-proto/messages.proto");
var message = builder.build("gauge.messages.Message");
var factory = require("./response-factory");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
require("./gauge-global");
var executeStepFn = require("./processor/ExecuteStepProcessor");
var executeHookFn = require("./processor/ExecuteHookProcessor");

var doNothing = function(request) {
  var response = factory.createStepNamesResponse(request.messageId);
  this._emit(response);
};

function executionResponse(isFailed, executionTime, messageId) {
  return factory.createExecutionStatusResponse(messageId, isFailed, executionTime);
}

function successExecutionStatus(request) {
  var response = executionResponse(false, 0, request.messageId);
  this._emit(response);
}

function executeStep (request) {
  var self = this;
  var promise = executeStepFn(request);
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
  var promise = executeHookFn(request, hookName, currentExecutionInfo);
  promise.then(
    function(value) {
      self._emit(value);
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
  executeHook.apply(this, [request, "beforeStep", request.stepExecutionStartingRequest.currentExecutionInfo]);
}

function executeAfterSuiteHook (request) {
  executeHook.apply(this, [request, "afterSuite", request.executionEndingRequest.currentExecutionInfo]);
}

function executeAfterSpecHook (request) {
  executeHook.apply(this, [request, "afterSpec", request.specExecutionEndingRequest.currentExecutionInfo]);
}

function executeAfterScenarioHook (request) {
  executeHook.apply(this, [request, "afterScenario", request.scenarioExecutionEndingRequest.currentExecutionInfo]);
}

function executeAfterStepHook (request) {
  executeHook.apply(this, [request, "afterStep", request.stepExecutionEndingRequest.currentExecutionInfo]);
}

function validateStep(request) {
  var stepImplemented = stepRegistry.exists(request.stepValidateRequest.stepText);
  var response = factory.createStepValidateResponse(request.messageId, stepImplemented);
  this._emit(response);
}

function killProcess() {
  process.exit();
}

var MessageProcessor = function() {
  EventEmitter.call(this);
  this.processors = {};
  this.processors[message.MessageType.StepNamesRequest] = doNothing;
  this.processors[message.MessageType.StepValidateRequest] = validateStep;
  this.processors[message.MessageType.SuiteDataStoreInit] = successExecutionStatus;
  this.processors[message.MessageType.SpecDataStoreInit] = successExecutionStatus;
  this.processors[message.MessageType.SpecExecutionStarting] = executeBeforeSpecHook;
  this.processors[message.MessageType.ScenarioDataStoreInit] = successExecutionStatus;
  this.processors[message.MessageType.ScenarioExecutionStarting] = executeBeforeScenarioHook;
  this.processors[message.MessageType.StepExecutionStarting] = executeBeforeStepHook;
  this.processors[message.MessageType.StepExecutionEnding] = executeAfterStepHook;
  this.processors[message.MessageType.ScenarioExecutionEnding] = executeAfterScenarioHook;
  this.processors[message.MessageType.SpecExecutionEnding] = executeAfterSpecHook;
  this.processors[message.MessageType.ExecutionStarting] = executeBeforeSuiteHook;
  this.processors[message.MessageType.ExecutionEnding] = executeAfterSuiteHook;
  this.processors[message.MessageType.ExecuteStep] = executeStep;
  this.processors[message.MessageType.KillProcessRequest] = killProcess;
};

util.inherits(MessageProcessor, EventEmitter);

MessageProcessor.prototype.getResponseFor = function(request){
  this.processors[request.messageType].call(this, request);
};

MessageProcessor.prototype._emit = function(data) {
  this.emit("messageProcessed", data);
};

module.exports = new MessageProcessor();
