var hookRegistry = require("./hook-registry"),
  customMessageRegistry = require("./custom-message-registry"),
  stepParser = require("./step-parser"),
  dataStore = require("./data-store-factory"),
  stepRegistry = require("./step-registry");

var gauge = { hooks: {}, dataStore: dataStore };

var step = function (stepName, options, stepFunction) {
  if (!stepName || !stepName.length) {
    throw new Error("Step text cannot be empty");
  }
  if (typeof options === "function" && !!options.call && !!options.apply) {
    stepFunction = options;
    options = { continueOnFailure: false };
  }

  var filepath = process.env.GAUGE_STEPFILEPATH;
  if (typeof stepName === "object" && !!stepName.length) {
    for (var i = 0; i < stepName.length; i++) {
      if (!stepName[i].length) {
        throw new Error("Step text cannot be empty");
      }
      stepRegistry.add(stepParser.generalise(stepName[i]), stepName[i], stepFunction, filepath, {}, options);
    }
  } else if (typeof stepName === "string") {
    stepRegistry.add(stepParser.generalise(stepName), stepName, stepFunction, filepath, {}, options);
  }
};

var hooks = {};

hookRegistry.types.forEach(function (type) {
  hooks[type] = function (fn, options) {
    hookRegistry.add(type, fn, options);
  };
  gauge.hooks[type] = function (fn, options) {
    console.warn("[DEPRECATED] gauge." + type + "() will be removed soon, use " + type + "() instead.");
    hooks[type](fn, options);
    this[type] = hooks[type];
  };
});

gauge.message = function (msg) {
  if (typeof msg === "string") {
    customMessageRegistry.add(msg);
  }
};

gauge.screenshotFn = null;

gauge.step = function (stepName, options, stepFunction) {
  console.warn("[DEPRECATED] gauge.step() will be removed soon, use step() instead.");
  step(stepName, options, stepFunction);
  this.step = step;
};

module.exports = {
  gauge: gauge,
  step: step,
  hooks: hooks,
};
