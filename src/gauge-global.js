var StepRegistry = require("./step-registry");
var stepParser = require("./step-parser");

global.stepRegistry = new StepRegistry();

global.gauge = function(stepName, stepFunction) {
    var generalisedName = stepParser.generalise(stepName);
    global.stepRegistry.add(generalisedName, stepFunction);
};

module.exports = {};
