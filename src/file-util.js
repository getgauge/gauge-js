var fs = require("fs");
var path = require("path");
var klawSync = require("klaw-sync");
var micromatch = require("micromatch");

var ignoredDirs = ['.gauge', '.git', 'node_modules', 'reports'];


function shouldIgnore(item) {
  return ignoredDirs.includes(path.basename(item.path))
}

exports = module.exports;

exports.getListOfFilesFromPath = function (basePath, conf) {
  if (!fs.existsSync(basePath)) return [];
  var options = { filter: shouldIgnore, noRecurseOnFailedFilter: true }
  var results = klawSync(basePath, options).map(function (item) {
    return item.path;
  });
  results = micromatch(results, conf.testMatch);
  return results;
};

exports.isSameFilePath = function (filePath1, filePath2) {
  return path.relative(filePath1, filePath2) === "";
};
