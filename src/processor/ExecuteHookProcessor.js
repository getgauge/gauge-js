/* globals hookRegistry */
var ResponseFactory = require("../response-factory");
var Q = require("q");
//var Test = require("../test");

function executionResponse(isFailed, executionTime, messageId, e) {
  return ResponseFactory.getExecutionStatusResponseMessage (messageId, isFailed, executionTime, e);
}

var ExecuteHook = function(request, hookLevel, currentExecutionInfo) {
  var deferred = Q.defer(),
      timestamp = Date.now(),
      tags = [];

  if (currentExecutionInfo) {
    specTags = currentExecutionInfo.currentSpec ? currentExecutionInfo.currentSpec.tags : [];
    sceanarioTags = currentExecutionInfo.currentScenario ? currentExecutionInfo.currentScenario.tags : [];
    tags = specTags.concat(sceanarioTags);
  }

  var hooks = hookRegistry.get(hookLevel);
  var filteredHooks = hooks.length ? filterHooks(hooks, tags) : [];

  for (var i = 0; i < filteredHooks.length; i++) {
    try {
      filteredHooks[i].fn.apply({}, [currentExecutionInfo, hookLevel]);
    } catch (e) {
      deferred.reject(executionResponse(true, (Date.now() - timestamp), request.messageId, e));
      return deferred.promise;
    }
  }

  deferred.resolve(executionResponse(false, (Date.now() - timestamp), request.messageId));

  return deferred.promise;
};

/**
 * Source: http://stackoverflow.com/a/26034767/575242
 */
var hasIntersection = function (arr1, arr2) {
  var intArr = arr1.filter(function (elem) { return arr2.indexOf(elem) > -1 });
  return intArr.length;
};

function filterHooks(hooks, tags) {
  return hooks.filter(function(hook) {
      var hookTags = (hook.options && hook.options.tags) ? hook.options.tags : [];
      var hookOperator = (hook.options && hook.options.operator) ? hook.options.operator : "AND";
      if (!hookTags.length) {
        return true;
      }
      var matched = hasIntersection(tags, hookTags);
      switch(hookOperator){
        case "AND":
          return matched === hookTags.length;
        case "OR":
          return matched > 0;
      }
      return false;
  });
}

module.exports = ExecuteHook;
