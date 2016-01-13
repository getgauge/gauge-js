/* globals hookRegistry */
var ResponseFactory = require("../response-factory");
var Q = require("q");
//var Test = require("../test");

function executionResponse(isFailed, executionTime, messageId, e) {
  return ResponseFactory.getExecutionStatusResponseMessage (messageId, isFailed, executionTime, e);
}

var ExecuteHook = function(request, hookLevel, currentExecutionInfo) {
  var deferred = Q.defer(),
      timestamp = Date.now();

  var hooks = hookRegistry.get(hookLevel);
  for (var i = 0; i < hooks.length; i++) {
    try {
      hooks[i].apply({}, [currentExecutionInfo, hookLevel]);
    } catch (e) {
      deferred.reject(executionResponse(true, (Date.now() - timestamp), request.messageId, e));
      return deferred.promise;
    }
  }

  deferred.resolve(executionResponse(false, (Date.now() - timestamp), request.messageId));

  return deferred.promise;
};

module.exports = ExecuteHook;
