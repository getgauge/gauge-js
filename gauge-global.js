StepRegistry = require('./step-registry');
stepParser = require('./step-parser');

global.stepRegistry = new StepRegistry();

global.gauge = function(stepName, stepFunction) {
    var generalisedName = stepParser.generalise(stepName);
    stepRegistry.add(generalisedName, stepFunction);
};

module.exports = {};
