var fs = require("fs");
var path = require("path");

var PACKAGE_JSON = "package.json";

var defaultConfig = {
  testMatch: ["**/tests/**/*.js"]
};

function resolveConfigPath(pathToResolve, initialPath) {
  
  var packageJson = path.resolve(pathToResolve, PACKAGE_JSON);
  if ( fs.existsSync(packageJson) && !fs.lstatSync(packageJson).isDirectory()) {
    return packageJson;
  }
  // This is the system root.
  // We tried everything, config is nowhere to be found ¯\_(ツ)_/¯
  if (pathToResolve === path.sep) {
    throw new Error("GaugeJS: Can't find package file based on provided path: " + initialPath);
  }
  return resolveConfigPath(
    path.dirname(pathToResolve),
    initialPath
  );
}

function Read(basePath) {
  if (!fs.existsSync(basePath)) {
    throw new Error(
      "GaugeJS: Can't find a root directory while resolving a package file path.\n" +
        "Provided path to resolve: " + basePath   
      );
  }
  var configPath = resolveConfigPath(basePath, basePath);
  var configObject;
  try {
    configObject = require(configPath);
  } catch (error) {
    throw new Error(
        "GaugeJS: Failed to parse config file " + configPath
    );
  }
  //if there is no "gauge" property in package.json we will load defaults
  configObject = configObject.gauge || defaultConfig;

  return configObject;
}

module.exports = {
  readConfig: Read
};
