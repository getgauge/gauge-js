var StepRegistry = require("./step-registry"),
    HookRegistry = require("./hook-registry"),
    CustomMessageRegistry = require("./custom-message-registry"),
    stepParser = require("./step-parser");

global.stepParser = stepParser;
global.stepRegistry = new StepRegistry();
global.hookRegistry = new HookRegistry();
global.customMessageRegistry = new CustomMessageRegistry();

global.gauge = function(stepName, stepFunction) {
  var generalisedName = global.stepParser.generalise(stepName);
  global.stepRegistry.add(generalisedName, stepName, stepFunction);
};

global.hookRegistry.types.forEach(function (type) {
  global[type] = function (fn, options) {
    global.hookRegistry.add(type, fn, options);
  };
});

global.gaugeMessage = function(msg) {
  if (typeof msg === "string") {
    global.customMessageRegistry.add(msg);
  }
};

module.exports = {};
