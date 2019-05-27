var os = require("os"),
  path = require("path"),
  fs = require("fs"),
  child_process = require("child_process");
var logger= require("./logger");

var screenshot = function (tmpfile) {
  tmpfile = tmpfile || path.join(os.tmpdir(), "screenshot-gauge-js-" + Date.now() + ".png");
  var proc = child_process.spawnSync("gauge_screenshot", [tmpfile]);
  if (proc.error) {
    logger.error(proc.error.toString());
    return "";
  }
  try {
    return Buffer.from(fs.readFileSync(tmpfile)).toString("base64");
  } catch (e) {
    logger.info(e.toString());
    return "";
  }
};

function hasCustumScreenGrabber() {
  return global.gauge && global.gauge.screenshotFn && typeof global.gauge.screenshotFn === "function";
}

function capture() {
  var screenshotFn = hasCustumScreenGrabber() ? global.gauge.screenshotFn : screenshot;
  var res = screenshotFn();
  if (res instanceof Promise) {
    return res;
  }
  return Promise.resolve(res);
}

module.exports = { capture: capture };
