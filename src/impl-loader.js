require("./gauge-global");
var fileUtil = require("./file-util");

function loadImpl(projectRoot) {
  fileUtil.getListOfFilesFromPath(projectRoot + "/" + "src").forEach(function(filePath) {
    require(filePath);
  });
}

module.exports= {
  load: loadImpl
}
