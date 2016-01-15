var fs = require("fs-extra"),
    path = require("path"),
    archiver = require("archiver"),
    child_process = require("child_process"),
    CWD = process.cwd();

var localPath = function (relativePath) {
  return relativePath ? path.resolve(CWD, relativePath) : path.resolve(CWD);
};

var plugin = require(localPath("./js.json"));

var homeDir = process.env[(process.platform == "win32") ? "USERPROFILE" : "HOME"];

var pluginInstallDir = path.resolve(homeDir, ".gauge", "plugins", plugin.id, plugin.version);

var cleanDir = function (dirPath) {
  try {
    fs.removeSync(dirPath);
  } catch (err) {
    console.error("Error removing directory: %s", err.message);
  }
};

var createDir = function (dirPath) {
  try {
    fs.ensureDirSync(dirPath);
  } catch (err) {
    console.error("Error creating directory: %s", err.message);
  }
};

var recreateDir = function (dirPath) {
  cleanDir(dirPath);
  createDir(dirPath);
};

var prepareFiles = function () {
  var buildDir = localPath("build"),
      copyList = ["gauge-proto", "src", "skel", "index.js", "js.json", "package.json", "README.md"];

  recreateDir(buildDir);

  copyList.forEach(function (item) {
    try {
      fs.copySync(localPath(item), path.join(buildDir, item), { clobber: true, filter: function (f) {
        return !(/(\/.git|^\/build)/.test(f.split(localPath())[1]));
      }});
    } catch (err) {
      console.error("Failed to copy %s to build directory: %s", item, err.message);
      console.error(err.stack);
    }
  });

  try {
    fs.removeSync(path.join(buildDir, "gauge-proto", ".git"));
  } catch (err) {
    console.error("Failed to remove .git in gauge-proto: %s", err.message);
    console.error(err.stack);
  }

  try {
    child_process.execSync("npm install --production", { cwd: buildDir });
  } catch (err) {
    console.error("Error installing modules from NPM: %s", err.message);
    console.error(err.stack);
  }

};

var installPluginFiles = function () {
  recreateDir(pluginInstallDir);

  prepareFiles();

  try {
    fs.copySync(localPath("build"), pluginInstallDir);
  } catch (err) {
    console.error("Failed to install plugin: %s", err.message);
    console.error(err.stack);
  }

  console.log("Installed gauge-%s v%s", plugin.id, plugin.version);
};

var createPackage = function () {
  var zip = archiver("zip"),
      deployDir = localPath("deploy"),
      buildDir = localPath("build"),
      packageFile = "gauge-" + plugin.id + "-" + plugin.version + ".zip";

  recreateDir(deployDir);
  prepareFiles();

  var package = fs.createWriteStream(path.join(deployDir, packageFile));

  zip.on("error", function (err) {
    throw err;
  });

  package.on("close", function () {
    console.log("Created: %s", path.join("deploy", packageFile));
    console.log("To install this plugin, run:\n\t$ gauge --install js --file %s", path.join("deploy", packageFile));
  });

  zip.pipe(package);

  zip.directory(buildDir, "/").finalize();

};

if (process.argv[2] === "--package") {
  createPackage();
} else {
  installPluginFiles();
}
