var fileUtil = require("./file-util"),
    path = require("path"),
    VM = require("./vm");

function loadImpl(projectRoot) {
  var vm = new VM();
  fileUtil.getListOfFilesFromPath(path.join(projectRoot, "tests")).forEach(function(filePath) {
    process.env.GAUGE_STEPFILEPATH = filePath;
    vm.runFile(filePath);
  });
}

module.exports= {
  load: loadImpl
};
