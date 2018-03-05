var fs = require("fs");
var path = require("path");
var klawSync = require("klaw-sync");

function isJSFile(item) {
  return path.extname(item.path) === ".js";
}

function collectFilesIn(dir) {
  return klawSync(dir, { filter: isJSFile }).map(function (item) {
    return item.path;
  });
}

function getImplDirs(projectRoot) {
  if (process.env.STEP_IMPL_DIR) {
    return process.env.STEP_IMPL_DIR.split(",").map(function (dir) {
      return path.join(projectRoot, dir.trim());
    });
  }
  return [path.join(projectRoot, "tests")];
}

exports = module.exports;

exports.getListOfFiles = function (projectRoot) {
  var results = getImplDirs(projectRoot).reduce(function (files, dir) {
    if (!fs.existsSync(dir)) {
      console.log("Failed to load implementations from " + dir);
      return files;
    }
    return files.concat(collectFilesIn(dir));
  }, []);
  return results;
};

exports.isSameFilePath = function (filePath1, filePath2) {
  return path.relative(filePath1, filePath2) === "";
};
