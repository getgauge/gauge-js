var processors = require("./message-processor");

var LspServerHandler = function (server, options) {
  this.server = server;
  this.options = options;
};

LspServerHandler.prototype = {
  getStepNames: function (call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.StepNamesRequest,
      stepNamesRequest: call.request
    });
    var res = processors.stepNamesResponse.call(this, req);
    callback(null, res.stepNamesResponse);
  },

  cacheFile: function (call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.CacheFileRequest,
      cacheFileRequest: call.request
    });
    processors.cacheFileResponse.call(this, req);
    callback(null, this.options.message.create({}));
  },

  getStepPositions: function (call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.StepPositionsRequest,
      stepPositionsRequest: call.request
    });
    var res = processors.stepPositions.call(this, req);
    callback(null, res.stepPositionsResponse);
  },

  getImplementationFiles: function (call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.ImplementationFileListRequest,
      implementationFileListRequest: call.request
    });
    var res = processors.implementationFiles.call(this, req);
    callback(null, res.implementationFileListResponse);
  },

  implementStub: function (call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.StubImplementationCodeRequest,
      stubImplementationCodeRequest: call.request
    });
    var res = processors.implementStubResponse.call(this, req);
    callback(null, res.fileDiff);
  },

  validateStep: function (call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.StepValidateRequest,
      stepValidateRequest: call.request
    });
    var res = processors.stepValidateResponse.call(this, req);
    callback(null, res.stepValidateResponse);
  },

  refactor: function (call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.RefactorRequest,
      refactorRequest: call.request
    });
    var res = processors.refactorResponse.call(this, req);
    callback(null, res.refactorResponse);
  },

  getStepName: function (call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.StepNameRequest,
      stepNameRequest: call.request
    });
    var res = processors.stepNameResponse.call(this, req);
    callback(null, res.stepNameResponse);
  },

  getGlobPatterns: function (call, callback) {
    var req = this.options.message.create({
      messageId: 0,
      messageType: this.options.message.MessageType.ImplementationFileGlobPatternRequest,
      implementationFileGlobPatternRequest: call.request
    });
    var res = processors.implementationGlobPatternResponse.call(this, req);
    callback(null, res.implementationFileGlobPatternResponse);
  },

  killProcess: function (call, callback) {
    callback(null, this.options.message.create({}));
    setTimeout(100,function() {
      this.server.forceShutdown();
      process.exit(0);
    });
  }
};

module.exports = LspServerHandler;
