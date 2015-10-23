StepRegistry = require('./step-registry');

global.stepRegistry = new StepRegistry();

global.gauge = function(stepName, stepFunction) {
    stepRegistry.add(stepName, stepFunction);
};

module.exports = {};