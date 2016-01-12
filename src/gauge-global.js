var StepRegistry = require("./step-registry"),
    HookRegistry = require("./hook-registry"),
    stepParser = require("./step-parser");

global.stepParser = stepParser;
global.stepRegistry = new StepRegistry();
global.hookRegistry = new HookRegistry();

global.gauge = function(stepName, stepFunction) {
  var generalisedName = global.stepParser.generalise(stepName);
  global.stepRegistry.add(generalisedName, stepFunction);
};

global.hookRegistry.types.forEach(function (type) {
  global[type] = function (fn) {
    global.hookRegistry.add(type, fn);
  };
});

module.exports = {};
