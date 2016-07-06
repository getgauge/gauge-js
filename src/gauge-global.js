var hookRegistry = require("./hook-registry"),
    customMessageRegistry = require("./custom-message-registry"),
    stepParser = require("./step-parser"),
    dataStore = require("./data-store-factory"),
    stepRegistry = require("./step-registry");

var gauge_global = {};
gauge_global.hooks = {};
gauge_global.dataStore = dataStore;

gauge_global.step = function(stepName, stepFunction) {
  if (!stepName || !stepName.length) {
    throw new Error("Step text cannot be empty");
  }

  var filepath = process.env.GAUGE_STEPFILEPATH || "tests/step_implementations.js";
  if (typeof stepName === "object" && !!stepName.length) {
    for (var i=0; i<stepName.length; i++) {
      if (!stepName[i].length) {
        throw new Error("Step text cannot be empty");
      }
      stepRegistry.add(stepParser.generalise(stepName[i]), stepName[i], stepFunction, filepath);
    }
  } else if (typeof stepName === "string") {
    stepRegistry.add(stepParser.generalise(stepName), stepName, stepFunction, filepath);
  }
};

hookRegistry.types.forEach(function (type) {
  gauge_global.hooks[type] = function (fn, options) {
    hookRegistry.add(type, fn, options);
  };
});

gauge_global.message = function(msg) {
  if (typeof msg === "string") {
    customMessageRegistry.add(msg);
  }
};

gauge_global.screenshotFn = null;

module.exports = gauge_global;
