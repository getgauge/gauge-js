var fileUtil = require("./file-util"),
    path = require("path"),
    VM = require("./vm");

function loadImpl(projectRoot) {
  var vm = new VM();
  fileUtil.getListOfFilesFromPath(path.join(projectRoot, "tests")).forEach(function(filePath) {
    process.env.GAUGE_STEPFILEPATH = filePath;
    vm.contextify(filePath, process.env.GAUGE_PROJECT_ROOT);
    vm.runFile(filePath);
  });
}

module.exports= {
  load: loadImpl
};
