var fs = require("fs");
var path = require("path");

exports = module.exports;

exports.getListOfFilesFromPath = function(basePath) {
  var result = [];
  if(!fs.existsSync(basePath))
    return result;

  fs.readdirSync(basePath).forEach(function(fileName) {
    var filePath = path.join(basePath, fileName);
    var stat = fs.statSync(filePath);
    if (stat && !stat.isDirectory()) {
      result.push(filePath);
    }
  });

  return result;
};
