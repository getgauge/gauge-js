require('./gauge-global');
var fileUtil = require('./file-util');

function loadImpl(projectRoot) {
  fileUtil.getListOfFilesFromPath(projectRoot + '/' + 'step_implementations').forEach(function(filePath) {
    require(filePath);
  });
}

module.exports= {
  load: loadImpl
}
