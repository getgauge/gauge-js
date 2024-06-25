import hookRegistry from "./hook-registry.js";
import customMessageRegistry from "./custom-message-registry.js";
import dataStore from "./data-store-factory.js";
import stepRegistry from "./step-registry.js";
import customScreenshotFactory from "./custom-screenshot-registry.js";

const gauge = {hooks: {}, dataStore: dataStore};

export const step = function (stepName, options, stepFunction) {
  if (!stepName || !stepName.length) {
    throw new Error("Step text cannot be empty");
  }
  if (typeof options === "function" && !!options.call && !!options.apply) {
    stepFunction = options;
    options = {continueOnFailure: false};
  }

  const filepath = process.env.GAUGE_STEPFILEPATH;
  if (typeof stepName === "object" && !!stepName.length) {
    stepRegistry.addAlias(stepName, stepFunction, filepath, {}, options);
  } else if (typeof stepName === "string") {
    stepRegistry.add(stepName, stepFunction, filepath, {}, options);
  }
};

const hooks = {};

hookRegistry.types.forEach(function (type) {
  hooks[type] = function (fn, options) {
    hookRegistry.add(type, fn, options);
  };
});

gauge.message = function (msg) {
  if (typeof msg === "string") {
    customMessageRegistry.add(msg);
  }
};

gauge.screenshotFn = null;
gauge.customScreenshotWriter = null;

gauge.screenshot = function() {
  customScreenshotFactory.add();
};

export default {
  gauge: gauge,
  step: step,
  hooks: hooks,
};
