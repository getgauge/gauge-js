var fileUtil = require("./file-util"),
    path = require("path");

function loadImpl(projectRoot) {
  fileUtil.getListOfFilesFromPath(path.join(projectRoot, "tests")).forEach(function(filePath) {
    process.env.GAUGE_STEPFILEPATH = filePath;
    require(filePath);
  });
}

module.exports= {
  load: loadImpl
};
