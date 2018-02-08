var fileUtil = require("./file-util"),
    VM = require("./vm"),
    config = require("./config");

function loadImpl(projectRoot) {
  var vm = new VM();
  var configObject = config.getInstance(projectRoot);
  fileUtil.getListOfFilesFromPath(projectRoot, configObject).forEach(function(filePath) {
    process.env.GAUGE_STEPFILEPATH = filePath;
    vm.contextify(filePath, process.env.GAUGE_PROJECT_ROOT);
    vm.runFile(filePath);
  });
}

function getImplFileList(projectRoot) {
  var configObject = config.getInstance(projectRoot);
  return fileUtil.getListOfFilesFromPath(projectRoot, configObject);
}

module.exports= {
  load: loadImpl,
  getImplFileList: getImplFileList
};
