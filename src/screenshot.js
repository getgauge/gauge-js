const path = require("path"),
  fs = require("fs"),
  child_process = require("child_process");
var logger = require("./logger");
const SCREENSHOTS_DIR_ENV = "gauge_screenshots_dir";

var defaultScreenshotWriter = function () {
  return new Promise((resolve) => {
    const filePath = getScreenshotFileName();
    var proc = child_process.spawnSync("gauge_screenshot", [filePath]);
    if (proc.error) {
      logger.error(proc.error.toString());
    }
    resolve(path.basename(filePath));
  });
};

function getScreenshotFileName() {
  return path.join(process.env[SCREENSHOTS_DIR_ENV], "screenshot-" + process.hrtime.bigint() + ".png");
}

function isCustumScreenshotFun(funcName) {
  return global.gauge && global.gauge[funcName] && typeof global.gauge[funcName] === "function";
}

function getScreenshotFunc() {
  if (isCustumScreenshotFun("customScreenshotWriter")) {
    return () => {
      return new Promise((resolve) => {
        const screenshotFile = global.gauge.customScreenshotWriter();
        if (screenshotFile.constructor.name === "Promise") {
          screenshotFile.then((file) => {
            resolve(path.basename(file));
          });
        } else {
          resolve(path.basename(screenshotFile));
        }
      });
    };
  } else if (isCustumScreenshotFun("screenshotFn")) {
    return () => {
      return new Promise((resolve) => {
        logger.error("[DEPRECATED] gauge.screenshotFn will be removed soon, use gauge.customScreenshotWriter instead.");
        const res = global.gauge.screenshotFn();
        const screenshotFile = getScreenshotFileName();
        if (res.constructor.name == "Promise") {
          res.then((data) => {
            errorHandling( () => {
              fs.writeFileSync(screenshotFile, data);
              resolve(path.basename(screenshotFile));
            });
          });
        } else {
          errorHandling( () => {
            fs.writeFileSync(screenshotFile, res);
            resolve(path.basename(screenshotFile));
          });
        }
      });
    };
  }
  return defaultScreenshotWriter;
}

function errorHandling(action) {
  try {
    action();
  } catch(e) {
    logger.error(e);
  }
}
function capture() {
  var screenshotFn = getScreenshotFunc();
  return screenshotFn();
}

module.exports = { capture: capture };
