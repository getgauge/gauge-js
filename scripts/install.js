var fs = require("fs-extra"),
    path = require("path"),
    CWD = process.cwd();

var localPath = function (relativePath) {
  return relativePath ? path.resolve(CWD, relativePath) : path.resolve(CWD);
};

var plugin = require(localPath("./js.json"));

var homeDir = process.env[(process.platform == "win32") ? "USERPROFILE" : "HOME"];

var pluginInstallDir = path.resolve(homeDir, ".gauge", "plugins", plugin.id, plugin.version);

var cleanInstallDir = function () {
  try {
    fs.removeSync(pluginInstallDir);
  } catch (err) {
    console.error("Error removing plugin installation directory: %s", err.message);
  }
};

var createInstallDir = function () {
  try {
    fs.ensureDirSync(pluginInstallDir);
  } catch (err) {
    console.error("Error creating plugin installation directory: %s", err.message);
  }
};

var copyPluginFiles = function () {
  cleanInstallDir();
  createInstallDir();

  try {
    fs.copySync(localPath(), pluginInstallDir);
  } catch (err) {
    console.error("Failed to install plugin: %s", err.message);
  }

  console.log("Installed gauge-%s v%s", plugin.id, plugin.version);
};

copyPluginFiles();
