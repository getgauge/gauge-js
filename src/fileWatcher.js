var chokidar = require("chokidar");
var implLoader = require("./impl-loader");

function init(dir) {
  var watcher = chokidar.watch(dir);
  watcher.on("add", function (filePath) {
    implLoader.reloadFile(filePath);
  });
  watcher.on("change", function (filePath) {
    implLoader.reloadFile(filePath);
  });
  watcher.on("unlink", function (filePath) {
    implLoader.unloadFile(filePath);
  });

}

module.exports = {
  init: init
};