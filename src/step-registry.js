var StepRegistry = function () {
  this.registry = {};
};

/**
 * Add a step to the registry
 *
 * @param stepName Name of the step.
 * @param stepFunction Function to be executed for this step.
 */
StepRegistry.prototype.add = function (generalisedText, stepText, stepFunction, filePath) {
  this.registry[generalisedText] = { fn: stepFunction, stepText: stepText, generalisedText: generalisedText, filePath: filePath };
};

/**
 * Get the function associated with a step.
 *
 * @param stepName Name of the step.
 * @returns Function The function to be executed for this step.
 */
StepRegistry.prototype.get = function (stepName) {
  return stepName ? this.registry[stepName] : this.registry;
};

StepRegistry.prototype.getStepTexts = function () {
  var reg = this.registry;
  return Object.keys(reg).map(function (key) {
    return reg[key].stepText;
  });
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

StepRegistry.prototype.clear = function () {
  this.registry = {};
};

exports = module.exports = StepRegistry;
