var fileUtil = require("./file-util"),
  vm = require("./vm"),
  stepRegistry = require("./step-registry"),
  hookRegistry = require("./hook-registry");

function loadFile(filePath) {
  process.env.GAUGE_STEPFILEPATH = filePath;
  vm.contextify(filePath, process.env.GAUGE_PROJECT_ROOT);
  vm.runFile(filePath);
}

function loadImpl(sourceRoot) {
  fileUtil.getListOfFilesFromPath(sourceRoot).forEach(function (filePath) {
    loadFile(filePath);
  });
}

function unloadFile(filePath) {
  stepRegistry.clearFile(filePath);
  hookRegistry.clearFile(filePath);
}

function reloadFile(filePath) {
  unloadFile(filePath);
  loadFile(filePath);
}

module.exports = {
  load: loadImpl,
  reloadFile: reloadFile,
  unloadFile: unloadFile
};
