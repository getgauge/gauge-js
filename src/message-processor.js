var ProtoBuf = require("protobufjs");
var builder = ProtoBuf.loadProtoFile("gauge-proto/messages.proto");
var message = builder.build("gauge.messages.Message");
var ResponseFactory = require('./response-factory');
var EventEmitter = require('events').EventEmitter;
var util = require("util");
require('./gauge-global');
var ExecuteStepProcessor = require('./processor/ExecuteStepProcessor');

MessageProcessor = function() {
  EventEmitter.call(this);
  var self = this;
  this.processors = {};
  this.processors[message.MessageType.StepNamesRequest] = doNothing;
  this.processors[message.MessageType.StepValidateRequest] = validateStep;
  this.processors[message.MessageType.SuiteDataStoreInit] = successExecutionStatus;
  this.processors[message.MessageType.SpecDataStoreInit] = successExecutionStatus;
  this.processors[message.MessageType.SpecExecutionStarting] = successExecutionStatus;
  this.processors[message.MessageType.ScenarioDataStoreInit] = successExecutionStatus;
  this.processors[message.MessageType.ScenarioExecutionStarting] = successExecutionStatus;
  this.processors[message.MessageType.StepExecutionStarting] = successExecutionStatus;
  this.processors[message.MessageType.StepExecutionEnding] = successExecutionStatus;
  this.processors[message.MessageType.ScenarioExecutionEnding] = successExecutionStatus;
  this.processors[message.MessageType.SpecExecutionEnding] = successExecutionStatus;
  this.processors[message.MessageType.ExecutionStarting] = successExecutionStatus;
  this.processors[message.MessageType.ExecutionEnding] = successExecutionStatus;
  this.processors[message.MessageType.ExecuteStep] = executeStep;
  this.processors[message.MessageType.KillProcessRequest] = killProcess;
};

util.inherits(MessageProcessor, EventEmitter);

MessageProcessor.prototype.getResponseFor = function(request){
  this.processors[request.messageType].call(this, request);
};

MessageProcessor.prototype._emit = function(data) {
  this.emit('messageProcessed', data);
};

var doNothing = function(request) {
  var response = ResponseFactory.getStepNamesResponseMessage(request.messageId);
  this._emit(response);
};

function successExecutionStatus(request) {
  var response = executionResponse(false, 0, request.messageId);
  this._emit(response);
}

function executionResponse(isFailed, executionTime, messageId) {
  return ResponseFactory.getExecutionStatusResponseMessage (messageId, isFailed, executionTime);
}

function executeStep (request) {
  var promise = ExecuteStepProcessor(request);
  promise.done(this._emit.bind(this));
}

function validateStep(request) {
  var stepImplemented = stepRegistry.exists(request.stepValidateRequest.stepText);
  var response = ResponseFactory.getStepValidateResponseMessage(request.messageId, stepImplemented);
  this._emit(response);
}

function killProcess() {
  process.exit();
}

module.exports = new MessageProcessor();
