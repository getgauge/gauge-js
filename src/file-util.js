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


function getListOfFiles(projectRoot) {
  var results = getImplDirs(projectRoot).reduce(function (files, dir) {
    if (!fs.existsSync(dir)) {
      console.log("Failed to load implementations from " + dir);
      return files;
    }
    return files.concat(collectFilesIn(dir));
  }, []);
  return results;
}

function isSameFilePath(filePath1, filePath2) {
  return path.relative(filePath1, filePath2) === "";
}

function getFileName(dir, counter = 0) {
  var tmpl = counter && "step-implementation-" + counter + ".js" || "step-implementation.js";
  var fileName = path.join(dir, tmpl);
  if (!fs.existsSync(fileName)) {
    return fileName;
  }
  return getFileName(dir, ++counter);
}

module.exports = {
  getImplDirs: getImplDirs,
  getListOfFiles: getListOfFiles,
  isSameFilePath: isSameFilePath,
  getFileName: getFileName
};
