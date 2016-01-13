/* globals stepRegistry */
var factory = require("../response-factory");
var Q = require("q");
var Test = require("../test");

var executeStep = function(request) {
  var deferred = Q.defer();

  var parsedStepText = request.executeStepRequest.parsedStepText;

  var parameters = request.executeStepRequest.parameters.map(function(item) {
    return item.value ? item.value : item.table;
  });

  var timestamp = Date.now();

  new Test(stepRegistry.get(parsedStepText), parameters).run().then(
    function() {
      var response = factory.createExecutionStatusResponse(request.messageId, false, Date.now() - timestamp);
      deferred.resolve(response);
    },

    function() {
      var errorResponse = factory.createExecutionStatusResponse(request.messageId, true, Date.now() - timestamp);
      deferred.reject(errorResponse);
    }
  );

  return deferred.promise;
};

module.exports = executeStep;
