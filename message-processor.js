var ProtoBuf = require("protobufjs");
var ByteBuffer = ProtoBuf.ByteBuffer;
var builder = ProtoBuf.loadProtoFile("./gauge-proto/messages.proto");
var message = builder.build("gauge.messages.Message");

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
};

MessageProcessor.prototype.getResponseFor = function(request){
    // console.log(request, "--Incoming Request");
    return this.processors[request.messageType](request);
};

var doNothing = function(request) {
    return new message({
        messageId: request.messageId,
        messageType: message.MessageType.StepNamesResponse,
        stepNamesResponse: {
            steps: []
        }
    });
};

function successExecutionStatus(request) {
    return executionResponse(false, 0, request.messageId);
}

function executionResponse(isFailed, executionTime, messageId) {
    return new message({
        messageId: messageId,
        messageType: message.MessageType.ExecutionStatusResponse,
        executionStatusResponse: {
            executionResult: {
                failed: isFailed,
                executionTime: executionTime
            }
        }
    });
}

function validateStep(request) {
    //var stepImpl = steps[request.stepValidateRequest.stepText];
    var stepImpl = true;
    var response = null;
    if (stepImpl) {
        response = new message({
            messageId: request.messageId,
            messageType: message.MessageType.StepValidateResponse,
            stepValidateResponse: {
                isValid: true
            }
        });
    }
    else {
        response = new message({
            messageId: request.messageId,
            messageType: message.MessageType.StepValidateResponse,
            stepValidateResponse: {
                isValid: false,
                errorMessage: "Implementation not found"
            }
        });
    }
    return response;
}

module.exports = new MessageProcessor();
