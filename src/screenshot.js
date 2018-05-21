var os = require("os"),
    path = require("path"),
    fs = require("fs"),
    child_process = require("child_process");

var screenshot = function (tmpfile) {
  tmpfile = tmpfile || path.join(os.tmpdir(), "screenshot-gauge-js-" + Date.now() + ".png");
  var proc = child_process.spawnSync("gauge_screenshot", [tmpfile]);
  if (proc.error) {
    console.error(proc.error.toString());
    return "";
  }
  try {
    return Buffer.from(fs.readFileSync(tmpfile)).toString("base64");
  } catch (e) {
    console.log(e.toString());
    return "";
  }
};

module.exports = screenshot;
