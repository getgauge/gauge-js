var StepRegistry = function () {
    this.registry = {};
};

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

/**
* Checks if a given step exists.
*
* @param stepName Name of the step.
* @return boolean true if the step exists. false if it is not.
*/
StepRegistry.prototype.exists = function(stepName) {
  return stepName in this.registry;
};

exports = module.exports = StepRegistry;
