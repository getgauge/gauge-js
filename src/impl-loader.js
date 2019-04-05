var fileUtil = require("./file-util"),
  VM = require("./vm");
var loaded = false;
var loading = false;  

function loadImpl(stepRegistry) {
  if(loaded) {return;}
  while(loading){
    if(loaded) {return;}
  }
  loading = true;
  stepRegistry.clear();
  var vm = new VM();
  fileUtil.getListOfFiles().forEach(function(filePath) {
    process.env.GAUGE_STEPFILEPATH = filePath;
    vm.contextify(filePath, process.env.GAUGE_PROJECT_ROOT);
    vm.runFile(filePath);
  });
  loading = false;
  loaded = true;
}

module.exports= {
  load: loadImpl
};
