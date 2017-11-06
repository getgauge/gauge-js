var StepRegistry = function () {
  this.registry = {};
};

/**
 * Add a step to the registry
 *
 * @param stepName Name of the step.
 * @param stepFunction Function to be executed for this step.
 */
StepRegistry.prototype.add = function (generalisedText, stepText, stepFunction, filePath, options) {
  if (this.exists(generalisedText)) {
    this.registry[generalisedText].count++;
    return;
  }

  this.registry[generalisedText] = {
    fn: stepFunction,
    stepText: stepText,
    generalisedText: generalisedText,
    filePath: filePath,
    count: 1,
    options: options
  };
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

StepRegistry.prototype.isRecoverable = function (stepName) {
  var step = this.registry[stepName];
  if (!step) {
    return false;
  }
  return step.options.continueOnFailure;
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

/**
 * Checks if a given step is valid
 */
StepRegistry.prototype.validate = function(stepName) {
  var step = this.get(stepName);
  if (!step) {
    return { valid: false, reason: "notfound", file: null };
  }
  if (step.count > 1) {
    return { valid: false, reason: "duplicate", file: step.filePath };
  }
  return { valid: true, reason: null, file: null };
};

StepRegistry.prototype.clear = function () {
  this.registry = {};
};

module.exports = new StepRegistry();
