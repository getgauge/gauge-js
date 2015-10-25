StepRegistry = require('./step-registry');
stepParser = require('./step-parser');

global.stepRegistry = new StepRegistry();

global.gauge = function(stepName, stepFunction) {
    stepRegistry.add(stepName, stepFunction);
};

module.exports = {};
