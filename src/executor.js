/* globals stepRegistry, hookRegistry */
var factory = require("./response-factory");
var Q = require("q");
var Test = require("./test");
/* If test_timeout env variable is not available set the default to 1000ms */
var timeout = process.env.test_timeout || 1000;

// Source: http://stackoverflow.com/a/26034767/575242
var hasIntersection = function (arr1, arr2) {
  var intArr = arr1.filter(function (elem) { return arr2.indexOf(elem) > -1; });
  return intArr.length;
};

var filterHooks = function (hooks, tags) {
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
};


var executeStep = function(request) {
  var deferred = Q.defer();

  var parsedStepText = request.executeStepRequest.parsedStepText;

  var parameters = request.executeStepRequest.parameters.map(function(item) {
    return item.value ? item.value : item.table;
  });
  new Test(stepRegistry.get(parsedStepText).fn, parameters, timeout).run().then(
    function(result) {
      var response = factory.createExecutionStatusResponse(request.messageId, false, result.duration);
      deferred.resolve(response);
    },

    function(result) {
      var errorResponse = factory.createExecutionStatusResponse(request.messageId, true, result.duration, result.exception);
      deferred.reject(errorResponse);
    }
  );

  return deferred.promise;
};

var executeHook = function(request, hookLevel, currentExecutionInfo) {
  var deferred = Q.defer(),
      tags = [],
      timestamp = Date.now();

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
  var onPass = function (result) {
    if (number === filteredHooks.length - 1) {
      var response = factory.createExecutionStatusResponse(request.messageId, false, result.duration);
      deferred.resolve(response);
    }
    number++;
  };

  var onError = function(result) {
    var errorResponse = factory.createExecutionStatusResponse(request.messageId, true, result.duration, result.exception);
    deferred.reject(errorResponse);
  };

  for (var i = 0; i < filteredHooks.length; i++) {
    new Test(filteredHooks[i].fn, [currentExecutionInfo], timeout).run().then(onPass, onError);
  }

  return deferred.promise;
};


module.exports = {
  step: executeStep,
  hook: executeHook
};
