var fileUtil = require("./file-util"),
    VM = require("./vm"),
    config = require("./config");

function loadImpl(projectRoot) {
  var vm = new VM();
  var configObject = config.getInstance();
  fileUtil.getListOfFilesFromPath(projectRoot, configObject).forEach(function(filePath) {
    process.env.GAUGE_STEPFILEPATH = filePath;
    vm.contextify(filePath, process.env.GAUGE_PROJECT_ROOT);
    vm.runFile(filePath);
  });
}

module.exports= {
  load: loadImpl
};
