var hookRegistry = require("./hook-registry"),
  customMessageRegistry = require("./custom-message-registry"),
  dataStore = require("./data-store-factory"),
  stepRegistry = require("./step-registry"),
  logger = require("./logger"),
  customScreenshotFactory = require("./custom-screenshot-registry");

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
    stepRegistry.addAlias(stepName, stepFunction, filepath, {}, options);
  } else if (typeof stepName === "string") {
    stepRegistry.add(stepName, stepFunction, filepath, {}, options);
  }
};

var hooks = {};

hookRegistry.types.forEach(function (type) {
  hooks[type] = function (fn, options) {
    hookRegistry.add(type, fn, options);
  };
  gauge.hooks[type] = function (fn, options) {
    logger.error("[DEPRECATED] gauge." + type + "() will be removed soon, use " + type + "() instead.");
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
gauge.customScreenshotWriter = null;

gauge.step = function (stepName, options, stepFunction) {
  logger.error("[DEPRECATED] gauge.step() will be removed soon, use step() instead.");
  step(stepName, options, stepFunction);
  this.step = step;
};

gauge.screenshot = function() {
  customScreenshotFactory.add();
};

module.exports = {
  gauge: gauge,
  step: step,
  hooks: hooks,
};
