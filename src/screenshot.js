import path from "node:path";
import fs from "node:fs";
import child_process from "node:child_process";
import logger from "./logger.js";

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
      return new Promise((resolve, reject) => {
        const screenshotFile = global.gauge.customScreenshotWriter();
        if (screenshotFile.constructor.name === "Promise") {
          screenshotFile.then((file) => {
            resolve(path.basename(file));
          }).catch(reject);
        } else {
          resolve(path.basename(screenshotFile));
        }
      });
    };
  } else if (isCustumScreenshotFun("screenshotFn")) {
    return () => {
      return new Promise((resolve, reject) => {
        logger.error("[DEPRECATED] gauge.screenshotFn will be removed soon, use gauge.customScreenshotWriter instead.");
        const res = global.gauge.screenshotFn();
        const screenshotFile = getScreenshotFileName();
        if (res.constructor.name == "Promise") {
          res.then((data) => {
            writeScreenshotToFile(data, screenshotFile, resolve);
          })
            .catch(reject);
        } else {
          writeScreenshotToFile(res, screenshotFile, resolve);
        }
      });
    };
  }
  return defaultScreenshotWriter;
}

function writeScreenshotToFile(data, screenshotFile, resolver) {
  try {
    let options = typeof data === "string" ?
      [screenshotFile, data, "base64"] :
      [screenshotFile, data];

    fs.writeFileSync.apply(null, options);
    resolver(path.basename(screenshotFile));
  } catch(e) {
    logger.error(e);
  }
}
function capture() {
  var screenshotFn = getScreenshotFunc();
  return screenshotFn();
}

export default { capture: capture };
