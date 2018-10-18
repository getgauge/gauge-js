var fileUtil = require("./file-util"),
  VM = require("./vm");

function loadImpl() {
  var vm = new VM();
  fileUtil.getListOfFiles().forEach(function(filePath) {
    process.env.GAUGE_STEPFILEPATH = filePath;
    vm.contextify(filePath, process.env.GAUGE_PROJECT_ROOT);
    vm.runFile(filePath);
  });
}

module.exports= {
  load: loadImpl
};
