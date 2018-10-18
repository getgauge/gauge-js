var fs = require("fs-extra"),
  path = require("path"),
  archiver = require("archiver"),
  child_process = require("child_process"),
  CWD = process.cwd();

var localPath = function (relativePath) {
  return relativePath ? path.resolve(CWD, relativePath) : path.resolve(CWD);
};

var plugin = require(localPath("./js.json"));

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
    copyList = ["gauge-proto", "src", "skel", "index.js", "index.bat", "debug.bat", "js.json", "package.json", "package-lock.json", ".node-inspectorrc", "README.md"];

  recreateDir(buildDir);

  try {
    console.log("Updating git submodules...");
    child_process.execSync("git submodule update --init --recursive", { cwd: localPath() });
  } catch (err) {
    console.error("Error updating submodules: %s", err.toString());
    console.error(err.stack);
  }

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
};

var createPackage = function (callback) {
  var zip = archiver("zip"),
    deployDir = localPath("deploy"),
    buildDir = localPath("build"),
    packageFile = "gauge-" + plugin.id + "-" + plugin.version + ".zip";

  callback = callback || function () {};

  recreateDir(deployDir);
  prepareFiles();

  var package = fs.createWriteStream(path.join(deployDir, packageFile));

  zip.on("error", function (err) {
    throw err;
  });

  package.on("close", function () {
    console.log("Created: %s", path.join("deploy", packageFile));
    console.log("To install this plugin, run:\n\t$ gauge install js --file %s", path.join("deploy", packageFile));
    typeof callback == "function" && callback(path.join(deployDir, packageFile));
  });

  zip.pipe(package);

  zip.directory(buildDir, "/").finalize();
};

var installPluginFiles = function () {
  createPackage(function (packageFilePath) {
    var log;

    try {
      log = child_process.execSync("gauge uninstall " + plugin.id + " --version \"" + plugin.version + "\"");
      console.log(log.toString());
    } catch (err) {
      console.error("Could not uninstall existing plugin: %s", err.message);
    }

    try {
      log = child_process.execSync("gauge install " + plugin.id + " --file \"" + packageFilePath + "\"");
      console.log(log.toString());
    } catch (err) {
      console.error("Failed to install plugin: %s", err.message);
      console.error(err.stack);
      process.exit(1);
    }
  });
};

if (process.argv[2] === "--package") {
  createPackage();
} else {
  installPluginFiles();
}
