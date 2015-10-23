var fs = require('fs');

exports = module.exports;

exports.getListOfFilesFromPath = function(path) {
    var result = [];

    fs.readdirSync(path).forEach(function(fileName) {
        var filePath = path + fileName;
        var stat = fs.statSync(filePath);
        if (stat && !stat.isDirectory())
            result.push(filePath);
    });

    return result;
};


//var steps = {};
//
//global.gauge = function(stepName, stepFunction) {
//    console.log("Gauge is invoked");
//    steps[stepName] = stepFunction;
//};
//
//var getListOfFilesNames = function(path) {
//    return fs.readdirSync(path);
//};
//
//var listOfFiles = getListOfFilesNames(path);
//require(path + listOfFiles[0]);
//
//steps['Step Name'].call();


//var path = __dirname + "/step_impl/";
