var StepRegistry = require("./step-registry");

global.stepParser = require("./step-parser");
global.stepRegistry = new StepRegistry();

global.gauge = function(stepName, stepFunction) {
  var generalisedName = global.stepParser.generalise(stepName);
  global.stepRegistry.add(generalisedName, stepFunction);
};

module.exports = {};
