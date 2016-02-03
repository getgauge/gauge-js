/* globals hookRegistry */
var factory = require("../response-factory");
var Q = require("q");
var Test = require("../test");
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

  if (!filteredHooks.length){
    deferred.resolve(factory.createExecutionStatusResponse(request.messageId, false, Date.now() - timestamp));
    return deferred.promise;
  }

  var number = 0;
  var onPass = function () {
    if (number === filteredHooks.length - 1) {
      var response = factory.createExecutionStatusResponse(request.messageId, false, Date.now() - timestamp);
      deferred.resolve(response);
    }
    number++;
  };

  var onError = function() {
    var errorResponse = factory.createExecutionStatusResponse(request.messageId, true, Date.now() - timestamp);
    deferred.reject(errorResponse);
  };

  for (var i = 0; i < filteredHooks.length; i++) {
    new Test(filteredHooks[i].fn, [currentExecutionInfo], 10000).run().then(onPass, onError);
  }

  return deferred.promise;
};

module.exports = executeHook;
