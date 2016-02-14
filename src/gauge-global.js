var hookRegistry = require("./hook-registry"),
    customMessageRegistry = require("./custom-message-registry"),
    stepParser = require("./step-parser"),
    DataStore = require("./data-store-factory"),
    stepRegistry = require("./step-registry"),
    stepParser = require("./step-parser");

global.dataStore = new DataStore();

global.gauge = function(stepName, stepFunction) {
  if (!stepName || !stepName.length) {
    throw new Error("Step text cannot be empty");
  }

  var filepath = process.env.GAUGE_STEPFILEPATH || "tests/step_implementations.js";

  if (stepName instanceof Array) {
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
  global[type] = function (fn, options) {
    hookRegistry.add(type, fn, options);
  };
});

global.gaugeMessage = function(msg) {
  if (typeof msg === "string") {
    customMessageRegistry.add(msg);
  }
};

module.exports = {};
