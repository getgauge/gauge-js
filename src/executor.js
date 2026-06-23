import Table from "./table.js";
import factory from "./response-factory.js";
import Test from "./test.js";
import screenshot from "./screenshot.js";
import stepRegistry from "./step-registry.js";
import hookRegistry from "./hook-registry.js";
import customScreenshotRegistry from "./custom-screenshot-registry.js";
import customMessageRegistry from "./custom-message-registry.js";
import logger from "./logger.js";


/* If test_timeout env variable is not available set the default to 1000ms */
const timeout = process.env.test_timeout || 1000;

// Source: http://stackoverflow.com/a/26034767/575242
const hasIntersection = function (arr1, arr2) {
  const intArr = arr1.filter(function (elem) { return arr2.indexOf(elem) > -1; });
  return intArr.length;
};

const filterHooks = function (hooks, tags) {
  return hooks.filter(function (hook) {
    const hookTags = (hook.options && hook.options.tags) ? hook.options.tags : [];
    const hookOperator = (hook.options && hook.options.operator) ? hook.options.operator : "AND";
    if (!hookTags.length) {
      return true;
    }
    const matched = hasIntersection(tags, hookTags);
    switch (hookOperator) {
    case "AND":
      return matched === hookTags.length;
    case "OR":
      return matched > 0;
    }
    return false;
  });
};


const executeStep = function (executeStepRequest) {
  return new Promise(function (resolve, reject) {
    const parsedStepText = executeStepRequest.parsedStepText;

    const parameters = executeStepRequest.parameters.map(function (item) {
      return item.value ? item.value : item.table ? new Table(item.table) : "";
    });

    const step = stepRegistry.get(parsedStepText);
    new Test(step.fn, parameters, timeout).run().then(
      function (result) {
        const screenshotPromises = customScreenshotRegistry.get();
        const msgs = customMessageRegistry.get();
        customScreenshotRegistry.clear();
        customMessageRegistry.clear();
        screenshotPromises.then(function (screenshots) {
          const response = factory.createExecutionStatusResponse(false, result.duration, false, msgs, "", step.options.continueOnFailure, screenshots);
          resolve(response);
        });
      },

      function (result) {
        const screenshotPromises = customScreenshotRegistry.get();
        const msgs = customMessageRegistry.get();
        customScreenshotRegistry.clear();
        customMessageRegistry.clear();
        screenshotPromises.then(function (screenshots) {
          const errorResponse = factory.createExecutionStatusResponse(true, result.duration, result.exception, msgs, "", step.options.continueOnFailure, screenshots);
          if (process.env.screenshot_on_failure !== "false") {
            screenshot.capture().then(function (screenshotFile) {
              errorResponse.executionResult.failureScreenshotFile = screenshotFile;
              reject(errorResponse);
            }).catch(function (error) {
              logger.error("\nFailed to capture screenshot on failure.\n" + error);
              reject(errorResponse);
            });
          } else {
            reject(errorResponse);
          }
        });
      }
    );
  });
};

const executeHook = function (hookLevel, currentExecutionInfo) {
  return new Promise(function (resolve, reject) {
    let tags = [];
    const timestamp = Date.now();

    if (currentExecutionInfo) {
      const specTags = currentExecutionInfo.currentSpec ? currentExecutionInfo.currentSpec.tags : [];
      const scenarioTags = currentExecutionInfo.currentScenario ? currentExecutionInfo.currentScenario.tags : [];
      tags = specTags.concat(scenarioTags);
    }

    const hooks = hookRegistry.get(hookLevel);
    const filteredHooks = hooks.length ? filterHooks(hooks, tags) : [];

    if (!filteredHooks.length) {
      resolve(factory.createExecutionStatusResponse(false, Date.now() - timestamp));
      return;
    }

    let number = 0;
    const onPass = function (result) {
      if (number === filteredHooks.length - 1) {
        const response = factory.createExecutionStatusResponse(false, result.duration);
        resolve(response);
      }
      number++;
    };

    const onError = function (result) {
      const errorResponse = factory.createExecutionStatusResponse(true, result.duration, result.exception);
      if (process.env.screenshot_on_failure !== "false") {
        screenshot.capture().then(function (screenshotFile) {
          errorResponse.executionResult.failureScreenshotFile = screenshotFile;
          reject(errorResponse);
        }).catch(function (error) {
          logger.error("\nFailed to capture screenshot on failure.\n" + error);
          reject(errorResponse);
        });
      } else {
        reject(errorResponse);
      }
    };

    for (let i = 0; i < filteredHooks.length; i++) {
      new Test(filteredHooks[i].fn, [currentExecutionInfo], timeout).run().then(onPass, onError);
    }
  });
};


export default {
  step: executeStep,
  hook: executeHook
};
