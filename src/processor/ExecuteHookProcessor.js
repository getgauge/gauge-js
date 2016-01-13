/* globals hookRegistry */
var factory = require("../response-factory");
var Q = require("q");

/**
 * Source: http://stackoverflow.com/a/26034767/575242
 */
var hasIntersection = function (arr1, arr2) {
  var intArr = arr1.filter(function (elem) { return arr2.indexOf(elem) > -1; });
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

var executeHook = function(request, hookLevel, currentExecutionInfo) {
  var deferred = Q.defer(),
      timestamp = Date.now(),
      tags = [];

  if (currentExecutionInfo) {
    var specTags = currentExecutionInfo.currentSpec ? currentExecutionInfo.currentSpec.tags : [];
    var sceanarioTags = currentExecutionInfo.currentScenario ? currentExecutionInfo.currentScenario.tags : [];
    tags = specTags.concat(sceanarioTags);
  }

  var hooks = hookRegistry.get(hookLevel);
  var filteredHooks = hooks.length ? filterHooks(hooks, tags) : [];

  for (var i = 0; i < filteredHooks.length; i++) {
    try {
      filteredHooks[i].fn.apply({}, [currentExecutionInfo, hookLevel]);
    } catch (e) {
      deferred.reject(factory.createExecutionStatusResponse(request.messageId, true, Date.now() - timestamp, e));
      return deferred.promise;
    }
  }

  deferred.resolve(factory.createExecutionStatusResponse(request.messageId, false, Date.now() - timestamp));

  return deferred.promise;
};

module.exports = executeHook;
