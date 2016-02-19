#! /usr/bin/env node

var fs = require("fs"),
    path = require("path"),
    child_process = require("child_process");

var skeldir = path.join(__dirname, "skel"),
    srcdir = path.join(process.env.GAUGE_PROJECT_ROOT, "tests"),
    envdir = path.join(process.env.GAUGE_PROJECT_ROOT, "env", "default"),
    testCode = "step_implementation.js",
    jsPropertyFile = "js.properties";

if(process.argv[2] === "--init") {

  console.log("Initialising Gauge JavaScript project");
  fs.mkdir(srcdir, 484, function(err) {
    if (err && err.code !== "EEXIST") {
      console.error(err);
    } else {
      fs.createReadStream(path.join(skeldir, testCode))
        .pipe(fs.createWriteStream(path.join(srcdir, testCode)));
    }
  });

  fs.mkdir(envdir, 484, function(err) {
    if (err && err.code !== "EEXIST") {
      console.error(err);
    } else {
      fs.createReadStream(path.join(skeldir, jsPropertyFile))
        .pipe(fs.createWriteStream(path.join(envdir, jsPropertyFile)));
    }
  });
}

else if(process.argv[2] === "--start") {
  var args = ["./src/gauge.js", "--run"];
  var cmd = "node";
  if (process.env.DEBUG === "true") {
    cmd = process.platform === "win32" ? "debug.bat" : "node-debug";
  }
  if (process.platform === "win32") {
    child_process.exec([cmd, args.join(" ")].join(" "), { env: process.env, stdio: "inherit" }, function (err) {
      if (err) {
        console.log(err);
      }
    });
  } else {
    var runner = child_process.spawn(cmd, args, { env: process.env, stdio: "inherit" });
    runner.on("error", function (err) {
      console.log(err);
    });
  }
}
