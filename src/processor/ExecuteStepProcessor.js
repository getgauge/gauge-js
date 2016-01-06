var ResponseFactory = require("../response-factory");
var Q = require("q");
var Test = require("../test");

function executionResponse(isFailed, executionTime, messageId) {
  return ResponseFactory.getExecutionStatusResponseMessage (messageId, isFailed, executionTime);
}

var executeStep = function(request) {
  var deferred = Q.defer();

  var parsedStepText = request.executeStepRequest.parsedStepText;

  var parameters = request.executeStepRequest.parameters.map(function(item) {
    return item["value"] ? item["value"] : item["table"];
  });

  new Test(stepRegistry.get(parsedStepText), parameters).run().then(
    function() {
      var response = executionResponse(false, 0, request.messageId);
      deferred.resolve(response);
    },

    function() {
      var errorResponse = executionResponse(true, 0, request.messageId);
      deferred.reject(errorResponse);
    }
  );

  return deferred.promise;
};

module.exports = executeStep;
