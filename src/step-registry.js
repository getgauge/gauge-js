var StepRegistry = function () {
  this.registry = {};
};

/**
 * Add a step to the registry
 *
 * @param stepName Name of the step.
 * @param stepFunction Function to be executed for this step.
 */
StepRegistry.prototype.add = function (generalisedText, stepText, stepFunction, filePath, line, options) {
  if (this.exists(generalisedText)) {
    this.registry[generalisedText].count++;
    this.registry[generalisedText].fileLocations.push({ filePath: filePath, line: line });
    return;
  }

  this.registry[generalisedText] = {
    fn: stepFunction,
    stepText: stepText,
    generalisedText: generalisedText,
    fileLocations: [
      {
        filePath: filePath,
        line: line
      }
    ],
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

StepRegistry.prototype.getStepPositions = function (filePath) {
  var stepPositions = [];
  for (var step in this.registry) {
    for (var i = 0; i < this.registry[step].fileLocations.length; i++) {
      if (this.registry[step].fileLocations[i].filePath === filePath) {
        stepPositions.push({ stepValue: step, lineNumber: this.registry[step].fileLocations[i].line });
      }
    }
  }
  return stepPositions;
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
StepRegistry.prototype.exists = function (stepName) {
  return stepName in this.registry;
};

/**
 * Checks if a given step is valid
 */
StepRegistry.prototype.validate = function (stepName) {
  var step = this.get(stepName);
  if (!step) {
    return { valid: false, reason: "notfound", file: null };
  }
  if (step.count > 1) {
    return { valid: false, reason: "duplicate", file: step.fileLocations[0].filePath };
  }
  return { valid: true, reason: null, file: null };
};

StepRegistry.prototype.clear = function () {
  this.registry = {};
};

StepRegistry.prototype.deleteSteps = function (filePath) {
  var filterFunc = function (location) {
    return location.filePath !== filePath;
  };
  for (var stepText in this.registry) {
    if (this.registry[stepText].count > 1) {
      this.registry[stepText].fileLocations = this.registry[stepText].fileLocations.filter(filterFunc);
      this.registry[stepText].count = this.registry[stepText].fileLocations.length;
      if (this.registry[stepText].count === 0) {
        delete this.registry[stepText];
      }
    } else {
      delete this.registry[stepText];
    }
  }
};

module.exports = new StepRegistry();
