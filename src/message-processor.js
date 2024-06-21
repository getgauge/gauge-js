import fs from "node:fs";
import path from "node:path";
import factory from "./response-factory.js";
import stepRegistry from "./step-registry.js";
import customMessageRegistry from "./custom-message-registry.js";
import executor from "./executor.js";
import refactor from "./refactor.js";
import dataStore from "./data-store-factory.js";
import impl_loader from "./impl-loader.js";
import loader from "./static-loader.js";
import inspector from "node:inspector";
import fileUtil from "./file-util.js";
import customScreenshotRegistry from "./custom-screenshot-registry.js";
import logger from "./logger.js";

const config = fileUtil.parseJsonFileSyncSafe("./package.json", "utf8");

const ATTACH_DEBUGGER_EVENT = "Runner Ready for Debugging";

const GAUGE_PROJECT_ROOT = process.env.GAUGE_PROJECT_ROOT;

export const processCustomMessages = function (response) {
  const msgs = customMessageRegistry.get();
  response.executionResult.message = response.executionResult.message.concat(msgs);
  customMessageRegistry.clear();
  return response;
};

export const processScreenshots = function (response) {
  const screenshotPromises = customScreenshotRegistry.get();
  return screenshotPromises.then(function (screenshotFiles) {
    response.executionResult.screenshotFiles = response.executionResult.screenshotFiles.concat(screenshotFiles);
    customScreenshotRegistry.clear();
  });
};

export function executionResponse(isFailed, executionTime) {
  return factory.createExecutionStatusResponse(isFailed, executionTime);
}

export function successExecutionStatus() {
  return executionResponse(false, 0);
}

export function executeStep(request, callback) {
  const promise = executor.step(request);
  promise.then(
    function (value) {
      callback(value);
    },
    function (reason) {
      callback(reason);
    }
  );
}

export function executeHook(hookName, currentExecutionInfo, callback) {
  const promise = executor.hook(hookName, currentExecutionInfo);
  promise.then(
    function (response) {
      processCustomMessages(response);
      processScreenshots(response).then(function () {
        callback(response);
      });
    },
    function (reason) {
      processCustomMessages(reason);
      processScreenshots(reason).then(function () {
        callback(reason);
      });
    }
  );
}

export function startExecution(executionStartingRequest, callback) {
  impl_loader.load(stepRegistry).then(() => {
    executeHook("beforeSuite", executionStartingRequest.currentExecutionInfo, callback);
  });
}

export function executeBeforeSuiteHook(executionStartingRequest, callback) {
  if (process.env.DEBUGGING) {
    const port = parseInt(process.env.DEBUG_PORT);
    logger.info(ATTACH_DEBUGGER_EVENT);
    inspector.open(port, "127.0.0.1", true);
    const inspectorWaitTime = 1000;
    setTimeout(function () { startExecution(executionStartingRequest, callback); }, inspectorWaitTime);
  } else {
    startExecution(executionStartingRequest, callback);
  }
}

export function executeBeforeSpecHook(specExecutionStartingRequest, callback) {
  executeHook("beforeSpec", specExecutionStartingRequest.currentExecutionInfo, callback);
}

export function executeBeforeScenarioHook(scenarioExecutionStartingRequest, callback) {
  executeHook("beforeScenario", scenarioExecutionStartingRequest.currentExecutionInfo, callback);
}

export function executeBeforeStepHook(stepExecutionStartingRequest, callback) {
  customMessageRegistry.clear();
  executeHook("beforeStep", stepExecutionStartingRequest.currentExecutionInfo, callback);
}

export function executeAfterSuiteHook(executionEndingRequest, callback) {
  executeHook("afterSuite", executionEndingRequest.currentExecutionInfo, function (data) {
    dataStore.suiteStore.clear();
    callback(data);
  });
  if (process.env.DEBUGGING) {
    inspector.close();
  }
}

export function executeAfterSpecHook(specExecutionEndingRequest, callback) {
  executeHook("afterSpec", specExecutionEndingRequest.currentExecutionInfo, function (data) {
    dataStore.specStore.clear();
    callback(data);
  });
}

export function executeAfterScenarioHook(scenarioExecutionEndingRequest, callback) {
  executeHook("afterScenario", scenarioExecutionEndingRequest.currentExecutionInfo, function (data) {
    dataStore.scenarioStore.clear();
    callback(data);
  });
}

export function executeAfterStepHook(stepExecutionEndingRequest, callback) {
  executeHook("afterStep", stepExecutionEndingRequest.currentExecutionInfo, callback);
}

export const getParamsList = function (params) {
  return params.map(function (p, i) {
    return "arg" + i.toString();
  }).join(", ");
};

export const generateImplStub = function (stepValue) {
  let argCount = 0;
  const stepText = stepValue.stepValue.replace(/{}/g, function () {
    return "<arg" + argCount++ + ">";
  });
  return "step(\"" + stepText + "\", async function(" + getParamsList(stepValue.parameters) + ") {\n\t" +
    "throw 'Unimplemented Step';\n" +
    "});";
};

export const getSuggestionFor = function (request, validated) {
  if (validated.reason !== "notfound") {
    return "";
  }
  return generateImplStub(request.stepValue);
};

export const stepValidateResponse = function (stepValidateRequest, errorType) {
  const validated = stepRegistry.validate(stepValidateRequest.stepText);
  const suggestion = getSuggestionFor(stepValidateRequest, validated);
  return factory.createStepValidateResponse(errorType, validated, suggestion);
};

export const stepNamesResponse = function () {
  return factory.createStepNamesResponse(stepRegistry.getStepTexts());
};

export const stepNameResponse = function (stepNameRequest) {
  const stepValue = stepNameRequest.stepValue;
  const response = factory.createStepNameResponse();
  const step = stepRegistry.get(stepValue);
  if (step) {
    response.stepNameResponse.stepName = step.aliases;
    response.stepNameResponse.hasAlias = step.hasAlias;
    response.stepNameResponse.isStepPresent = true;
    response.stepNameResponse.fileName = step.fileLocations[0].filePath;
    response.stepNameResponse.span = step.fileLocations[0].span;
  }
  return response;
};

export const stepPositions = function (stepPositionsRequest) {
  const filepath = stepPositionsRequest.filePath;
  return factory.createStepPositionsResponse(stepRegistry.getStepPositions(filepath));
};

export const implementationFiles = function () {
  return factory.createImplementationFileListResponse(fileUtil.getListOfFiles());
};

export const implementStubResponse = function (stubImplementationCodeRequest) {
  const response = factory.createFileDiff();
  let filePath = stubImplementationCodeRequest.implementationFilePath;
  const codes = stubImplementationCodeRequest.codes;

  const reducer = function (accumulator, currentValue) {
    return accumulator + "\n" + currentValue;
  };
  let content = codes.reduce(reducer);

  let fileLineCount = 0;
  if (fs.existsSync(filePath)) {
    let fileContent = fs.readFileSync(filePath, "utf8").replace("\r\n", "\n");
    if (fileContent.trim().split("\n").length == fileContent.split("\n").length) {
      fileLineCount = fileContent.split("\n").length;
      content = "\n\n" + content;
    } else {
      fileLineCount = fileContent.split("\n").length;
      content = "\n" + content;
    }
  } else {
    filePath = fileUtil.getFileName(fileUtil.getImplDirs(GAUGE_PROJECT_ROOT)[0]);
  }

  const span = {start: fileLineCount, end: fileLineCount, startChar: 0, endChar: 0};
  const textDiffs = [{span: span, content: content}];
  response.fileDiff.filePath = filePath;
  response.fileDiff.textDiffs = textDiffs;
  return response;
};

export const refactorResponse = function (request) {
  let response = factory.createRefactorResponse();
  response = refactor(request, response);
  return response;
};

export const cacheFileResponse = function (cacheFileRequest, fileStatus) {
  const filePath = cacheFileRequest.filePath;
  if (!fileUtil.isJSFile(filePath) || !fileUtil.isInImplDir(filePath)) {
    return;
  }
  let CHANGED, OPENED, CLOSED, CREATED;
  if (config.hasPureJsGrpc) {
    CHANGED = fileStatus.values.CHANGED;
    OPENED = fileStatus.values.OPENED;
    CLOSED = fileStatus.values.CLOSED;
    CREATED = fileStatus.values.CREATED;
  } else {
    CHANGED = fileStatus.valuesById[fileStatus.values.CHANGED];
    OPENED = fileStatus.valuesById[fileStatus.values.OPENED];
    CLOSED = fileStatus.valuesById[fileStatus.values.CLOSED];
    CREATED = fileStatus.valuesById[fileStatus.values.CREATED];
  }
  if (cacheFileRequest.status === CREATED) {
    if (!stepRegistry.isFileCached(filePath)) {
      loader.reloadFile(filePath, fs.readFileSync(filePath, "utf8"));
    }
  } else if (cacheFileRequest.status === CHANGED || cacheFileRequest.status === OPENED || (
    cacheFileRequest.status === undefined && config.hasPureJsGrpc
  )) {
    loader.reloadFile(filePath, cacheFileRequest.content);
  } else if (cacheFileRequest.status === CLOSED &&
    fs.existsSync(filePath)) {
    loader.reloadFile(filePath, fs.readFileSync(filePath, "utf8"));
  } else {
    loader.unloadFile(filePath);
  }
};

export const implementationGlobPatternResponse = function () {
  const globPatterns = [];
  fileUtil.getImplDirs().forEach((dir) => {
    globPatterns.push(dir.split(path.sep).join("/") + "/**/*.js");
  });
  const response = factory.createImplementationFileGlobPatternResponse(globPatterns);
  return response;
};

export default {
  stepNamesResponse: stepNamesResponse,
  cacheFileResponse: cacheFileResponse,
  stepPositions: stepPositions,
  implementationFiles: implementationFiles,
  implementStubResponse: implementStubResponse,
  stepValidateResponse: stepValidateResponse,
  refactorResponse: refactorResponse,
  stepNameResponse: stepNameResponse,
  implementationGlobPatternResponse: implementationGlobPatternResponse,
  successExecutionStatus,
  executeBeforeSuiteHook,
  executeAfterSuiteHook,
  executeBeforeSpecHook,
  executeAfterSpecHook,
  executeBeforeScenarioHook,
  executeAfterScenarioHook,
  executeBeforeStepHook,
  executeAfterStepHook,
  executeStep
};
