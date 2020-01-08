var processors = require("./message-processor");

class ServiceHandlers {
  constructor(server, options) {
    this.server = server;
    this.options = options;
  }
  initializeSuiteDataStore(call, callback) {
    var res = processors.successExecutionStatus(call.request);
    callback(null, res);
  }
  startExecution(call, callback) {
    function responseCallback(response) {
      callback(null, response);
    }
    processors.executeBeforeSuiteHook(call.request, responseCallback);
  }
  initializeSpecDataStore(call, callback) {
    var res = processors.successExecutionStatus(call.request);
    callback(null, res);
  }
  startSpecExecution(call, callback) {
    function responseCallback(response) {
      callback(null, response);
    }
    processors.executeBeforeSpecHook(call.request, responseCallback);
  }
  initializeScenarioDataStore(call, callback) {
    var res = processors.successExecutionStatus(call.request);
    callback(null, res);
  }
  startScenarioExecution(call, callback) {
    function responseCallback(response) {
      callback(null, response);
    }
    processors.executeBeforeScenarioHook(call.request, responseCallback);
  }
  startStepExecution(call, callback) {
    function responseCallback(response) {
      callback(null, response);
    }
    processors.executeBeforeStepHook(call.request, responseCallback);
  }
  executeStep(call, callback) {
    function responseCallback(response) {
      callback(null, response);
    }
    processors.executeStep(call.request, responseCallback);
  }
  finishStepExecution(call, callback) {
    function responseCallback(response) {
      callback(null, response);
    }
    processors.executeAfterStepHook(call.request, responseCallback);
  }
  finishScenarioExecution(call, callback) {
    function responseCallback(response) {
      callback(null, response);
    }
    processors.executeAfterScenarioHook(call.request, responseCallback);
  }
  finishSpecExecution(call, callback) {
    function responseCallback(response) {
      callback(null, response);
    }
    processors.executeAfterSpecHook(call.request, responseCallback);
  }
  finishExecution(call, callback) {
    function responseCallback(response) {
      callback(null, response);
    }
    processors.executeAfterSuiteHook(call.request, responseCallback);
  }
  getStepNames(call, callback) {
    var res = processors.stepNamesResponse(call.request);
    callback(null, res.stepNamesResponse);
  }

  cacheFile(call, callback) {
    processors.cacheFileResponse(call.request, this.options.fileStatus);
    callback(null, {});
  }

  getStepPositions(call, callback) {
    var res = processors.stepPositions(call.request);
    callback(null, res.stepPositionsResponse);
  }

  getImplementationFiles(call, callback) {
    var res = processors.implementationFiles(call.request);
    callback(null, res.implementationFileListResponse);
  }

  implementStub(call, callback) {
    var res = processors.implementStubResponse(call.request);
    callback(null, res.fileDiff);
  }

  validateStep(call, callback) {
    var res = processors.stepValidateResponse(call.request, this.options.errorType);
    callback(null, res.stepValidateResponse);
  }

  refactor(call, callback) {
    var res = processors.refactorResponse(call.request);
    callback(null, res.refactorResponse);
  }

  getStepName(call, callback) {
    var res = processors.stepNameResponse(call.request);
    callback(null, res.stepNameResponse);
  }

  getGlobPatterns(call, callback) {
    var res = processors.implementationGlobPatternResponse(call.request);
    callback(null, res.implementationFileGlobPatternResponse);
  }
  kill(_call, callback) {
    callback(null, {});
    setTimeout(() => {
      this.server.forceShutdown();
      process.exit(0);
    }, 100);
  }
}

module.exports = ServiceHandlers;
