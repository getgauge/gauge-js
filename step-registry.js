
exports = module.exports = StepRegistry;

function StepRegistry() {
    this.registry = {};
}

/**
 * Add a step to the registry
 *
 * @param stepName Name of the step.
 * @param stepFunction Function to be executed for this step.
 */
StepRegistry.prototype.add = function (stepName, stepFunction) {
    this.registry[stepName] = stepFunction;
};

/**
 * Get the function associated with a step.
 *
 * @param stepName Name of the step.
 * @returns Function The function to be executed for this step.
 */
StepRegistry.prototype.get = function (stepName) {
    return this.registry[stepName];
};