var fs = require("fs");
var path = require("path");
var micromatch = require("micromatch");

exports = module.exports;

exports.getListOfFilesFromPath = function(basePath, conf) {
  if(!fs.existsSync(basePath)) {
    return [];
  }
  function walk(dir){
    var result = [];
  
    fs.readdirSync(dir).forEach(function(fileName){
      var filePath = path.join(dir, fileName);
      var stat = fs.statSync(filePath);
      if (stat && !stat.isDirectory()) {
        result.push(filePath);
      }else{
        var dirContent = walk(filePath);
        result = result.concat(dirContent);
      }
    });
    return result;
  }
  var result = walk(basePath);
  result = micromatch(result, conf.testMatch);
  return result;
};
