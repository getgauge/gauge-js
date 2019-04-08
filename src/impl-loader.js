var fileUtil = require("./file-util"),
  VM = require("./vm");
var loaded = false;

function loadImpl(stepRegistry) {
  return new Promise((resolve)=>{
    if(loaded) {return resolve();}
    stepRegistry.clear();
    var vm = new VM();
    fileUtil.getListOfFiles().forEach(function(filePath) {
      process.env.GAUGE_STEPFILEPATH = filePath;
      vm.contextify(filePath, process.env.GAUGE_PROJECT_ROOT);
      vm.runFile(filePath);
    });
    loaded = true;
    resolve();
  });
}

module.exports= {
  load: loadImpl
};
