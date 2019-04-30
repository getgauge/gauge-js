var http = require("http");
var qs = require("querystring");
var fs = require("fs");
var path = require("path");
var version = require("../package.json").version;
var os = require("os");
const gaTestTrackingID = "UA-100778536-1",
  gaTrackingID = "UA-54838477-1";

var getProjectInfo = function () {
  if (!fs.existsSync(path.join(process.env.GAUGE_PROJECT_ROOT, "package.json"))) {
    return;
  }
  var data = fs.readFileSync(path.join(process.env.GAUGE_PROJECT_ROOT, "package.json"), "utf-8");
  return JSON.parse(data);
};

var getPostData = function (medium, cid) {
  var pi = getProjectInfo();
  if (!pi) {
    return "";
  }
  var labels = pi.dependencies && pi.dependencies.taiko && "taiko," + os.platform() || os.platform();
  var gaID = process.env.use_test_ga.toLowerCase() === "true" ? gaTestTrackingID : gaTrackingID;
  return qs.stringify({
    aip: "1",
    an: "Gauge Core",
    av: version,
    cid: cid,
    cm: medium,
    cs: "Gauge Core",
    ea: "js",
    ec: "runner",
    el: labels,
    t: "event",
    v: "1",
    tid: gaID
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
  if (!JSON.parse(process.env.GAUGE_TELEMETRY_ENABLED)) {
    return;
  }
  var data = getPostData(medium, process.env.GAUGE_UNIQUE_INSTALLATION_ID);
  var req = http.request(getPostOptions(data), function (res) {
    res.setEncoding("utf8");
  });
  req.on("error", (e) => {
    console.error(`Connection Error: ${e.message}`);
  });
  req.write(data);
  req.end();
};

module.exports = {
  trackLSP: function () {
    send("daemon");
  }
};
