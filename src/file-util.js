var fs = require('fs');

exports = module.exports;

exports.getListOfFilesFromPath = function(path) {
    var result = [];

    fs.readdirSync(path).forEach(function(fileName) {
        var filePath = path + '/' + fileName;
        var stat = fs.statSync(filePath);
        if (stat && !stat.isDirectory()){
          result.push(filePath);
        }
    });

    return result;
};
