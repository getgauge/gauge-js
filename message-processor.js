var ProtoBuf = require("protobufjs");
var ByteBuffer = ProtoBuf.ByteBuffer;
var builder = ProtoBuf.loadProtoFile("./gauge-proto/messages.proto");
var message = builder.build("gauge.messages.Message");
var errorType = builder.build("gauge.messages.StepValidateResponse.ErrorType");
var ResponseFactory = require('./response-factory');
require('./gauge-global');

MessageProcessor = function() {
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

MessageProcessor.prototype.getResponseFor = function(request){
    // console.log(request.messageType, "--Incoming Request");
    return this.processors[request.messageType](request);
};

var doNothing = function(request) {
  return ResponseFactory.getStepNamesResponseMessage(request.messageId);
};

function successExecutionStatus(request) {
    return executionResponse(false, 0, request.messageId);
}

function executionResponse(isFailed, executionTime, messageId) {
    return ResponseFactory.getExecutionStatusResponseMessage (messageId, isFailed, executionTime);
}

function executeStep (request) {
    var parsedStepText = request.executeStepRequest.parsedStepText;
    try {
      stepRegistry.get(parsedStepText)();
      return executionResponse(false, 0, request.messageId);
    } catch (error) {
      return executionResponse(true, 0, request.messageId);
    }
}

function validateStep(request) {
    var stepImplemented = stepRegistry.exists(request.stepValidateRequest.stepText);
    return ResponseFactory.getStepValidateResponseMessage(request.messageId, stepImplemented);
}

function killProcess() {
  process.exit();
}

module.exports = new MessageProcessor();
