require('./gauge-global');
var fileUtil = require('./file-util');

fileUtil.getListOfFilesFromPath(__dirname + '/' + 'step_impl').forEach(function(filePath) {
    require(filePath);
});
