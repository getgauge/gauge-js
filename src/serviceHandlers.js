var processors = require("./message-processor");

class ServiceHandlers {
  constructor(server, options) {
    this.server = server;
    this.options = options;
  }
  initializeSuiteDataStore(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.SuiteDataStoreInitRequest,
      suiteDataStoreInitRequest: call.request
    });
    var res = processors.successExecutionStatus.call(this, req);
    callback(null, res.executionStatusResponse);
  }
  startExecution(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.ExecutionStartingRequest,
      executionStartingRequest: call.request
    });
    function responseCallback(response) {
      callback(null, response.executionStatusResponse);
    }
    processors.executeBeforeSuiteHook.call(this, req, responseCallback);
  }
  initializeSpecDataStore(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.SpecDataStoreInitRequest,
      specDataStoreInitRequest: call.request
    });
    var res = processors.successExecutionStatus.call(this, req);
    callback(null, res.executionStatusResponse);
  }
  startSpecExecution(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.SpecExecutionStartingRequest,
      specExecutionStartingRequest: call.request
    });
    function responseCallback(response) {
      callback(null, response.executionStatusResponse);
    }
    processors.executeBeforeSpecHook.call(this, req, responseCallback);
  }
  initializeScenarioDataStore(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.ScenarioDataStoreInitRequest,
      scenarioDataStoreInitRequest: call.request
    });
    var res = processors.successExecutionStatus.call(this, req);
    callback(null, res.executionStatusResponse);
  }
  startScenarioExecution(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.ScenarioExecutionStartingRequest,
      scenarioExecutionStartingRequest: call.request
    });
    function responseCallback(response) {
      callback(null, response.executionStatusResponse);
    }
    processors.executeBeforeScenarioHook.call(this, req, responseCallback);
  }
  startStepExecution(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.StepExecutionStartingRequest,
      stepExecutionStartingRequest: call.request
    });
    function responseCallback(response) {
      callback(null, response.executionStatusResponse);
    }
    processors.executeBeforeStepHook.call(this, req, responseCallback);
  }
  executeStep(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.ExecuteStepRequest,
      executeStepRequest: call.request
    });
    function responseCallback(response) {
      callback(null, response.executionStatusResponse);
    }
    processors.executeStep.call(this, req, responseCallback);
  }
  finishStepExecution(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.StepExecutionEndingRequest,
      stepExecutionEndingRequest: call.request
    });
    function responseCallback(response) {
      callback(null, response.executionStatusResponse);
    }
    processors.executeAfterStepHook.call(this, req, responseCallback);
  }
  finishScenarioExecution(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.ScenarioExecutionEndingRequest,
      scenarioExecutionEndingRequest: call.request
    });
    function responseCallback(response) {
      callback(null, response.executionStatusResponse);
    }
    processors.executeAfterScenarioHook.call(this, req, responseCallback);
  }
  finishSpecExecution(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.SpecExecutionEndingRequest,
      specExecutionEndingRequest: call.request
    });
    function responseCallback(response) {
      callback(null, response.executionStatusResponse);
    }
    processors.executeAfterSpecHook.call(this, req, responseCallback);
  }
  finishExecution(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.ExecutionEndingRequest,
      executionEndingRequest: call.request
    });
    function responseCallback(response) {
      callback(null, response.executionStatusResponse);
    }
    processors.executeAfterSuiteHook.call(this, req, responseCallback);
  }
  getStepNames(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.StepNamesRequest,
      stepNamesRequest: call.request
    });
    var res = processors.stepNamesResponse.call(this, req);
    callback(null, res.stepNamesResponse);
  }

  cacheFile(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.CacheFileRequest,
      cacheFileRequest: call.request
    });
    processors.cacheFileResponse.call(this, req);
    callback(null, this.options.message.create({}));
  }

  getStepPositions(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.StepPositionsRequest,
      stepPositionsRequest: call.request
    });
    var res = processors.stepPositions.call(this, req);
    callback(null, res.stepPositionsResponse);
  }

  getImplementationFiles(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.ImplementationFileListRequest,
      implementationFileListRequest: call.request
    });
    var res = processors.implementationFiles.call(this, req);
    callback(null, res.implementationFileListResponse);
  }

  implementStub(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.StubImplementationCodeRequest,
      stubImplementationCodeRequest: call.request
    });
    var res = processors.implementStubResponse.call(this, req);
    callback(null, res.fileDiff);
  }

  validateStep(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.StepValidateRequest,
      stepValidateRequest: call.request
    });
    var res = processors.stepValidateResponse.call(this, req);
    callback(null, res.stepValidateResponse);
  }

  refactor(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.RefactorRequest,
      refactorRequest: call.request
    });
    var res = processors.refactorResponse.call(this, req);
    callback(null, res.refactorResponse);
  }

  getStepName(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.StepNameRequest,
      stepNameRequest: call.request
    });
    var res = processors.stepNameResponse.call(this, req);
    callback(null, res.stepNameResponse);
  }

  getGlobPatterns(call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.ImplementationFileGlobPatternRequest,
      implementationFileGlobPatternRequest: call.request
    });
    var res = processors.implementationGlobPatternResponse.call(this, req);
    callback(null, res.implementationFileGlobPatternResponse);
  }
  kill(_call, callback) {
    callback(null, this.options.message.create({}));
    setTimeout(() => {
      this.server.forceShutdown();
      process.exit(0);
    }, 100);
  }
}

module.exports = ServiceHandlers;
