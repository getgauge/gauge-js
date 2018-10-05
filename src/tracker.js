var http = require("http");
var qs = require("querystring");
var fs = require("fs");
var path = require("path");
var version = require("../package.json").version;
var os = require("os");

var isCI = function () {
  var env = process.env;
  return !!(env.CI || env.GO_SERVER_URL || env.JENKINS_URL || env.TEAMCITY_VERSION || env.TFS_BUILD);
};

var getProjectInfo = function () {
  var data = fs.readFileSync(path.join(process.env.GAUGE_PROJECT_ROOT, "package.json"), "utf-8");
  return JSON.parse(data);
};

var getPostData = function (medium, cid) {
  var pi = getProjectInfo();
  var labels = pi.dependencies.taiko && "taiko," + os.platform() || os.platform();
  return qs.stringify({
    aip: "1", an: "Gauge Core", av: version, cid: cid,
    cm: medium, cs: "Gauge Core",
    ea: "js", ec: "runner", el: labels,
    t: "event", v: "1",
    tid: "UA-54838477-1"
  });
};

var getPostOptions = function (data) {
  return {
    host: "www.google-analytics.com",
    port: 80,
    path: "/collect",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(data),
      "Accept-Encoding": "gzip"
    }
  };
};


var send = function (medium) {
  if (!process.env.GAUGE_TELEMETRY_ENABLED) { return Promise.resolve(); }
  if (medium === "console" && isCI()) { medium = "CI"; }
  var data = getPostData(medium, process.env.GAUGE_UNIQUE_INSTALLATION_ID);
  return new Promise(function (resolve, reject) {
    var req = http.request(getPostOptions(data), function (res) {
      res.setEncoding("utf8");
      res.on("end", resolve);
      res.on("error", reject);
    });
    req.write(data);
    req.end();
  });
};

module.exports = {
  trackConsole: function () { return send("console"); },
  trackLSP: function () { return send("deamon"); }
};
