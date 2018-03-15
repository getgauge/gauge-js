var fs = require("fs");
var path = require("path");
var klawSync = require("klaw-sync");

function isJSFile(file) {
  return path.extname(file) === ".js";
}

function collectFilesIn(dir) {
  return klawSync(dir, { filter: function (item) { return isJSFile(item.path); } }).map(function (item) {
    return item.path;
  });
}

function getImplDirs() {
  const projectRoot = process.env.GAUGE_PROJECT_ROOT;
  if (process.env.STEP_IMPL_DIR) {
    return process.env.STEP_IMPL_DIR.split(",").map(function (dir) {
      return path.join(projectRoot, dir.trim());
    });
  }
  return [path.join(projectRoot, "tests")];
}


function getListOfFiles() {
  var results = getImplDirs().reduce(function (files, dir) {
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

function isInImplDir(filePath) {
  return getImplDirs().findIndex((implDir) => {
    if (path.normalize(filePath).startsWith(path.normalize(implDir))) {
      return true;
    }
  }) !== -1;
}

module.exports = {
  getImplDirs: getImplDirs,
  getListOfFiles: getListOfFiles,
  isSameFilePath: isSameFilePath,
  getFileName: getFileName,
  isJSFile: isJSFile,
  isInImplDir: isInImplDir
};
