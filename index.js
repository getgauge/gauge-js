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
  if (process.env.DEBUG === "true") {
    var node_debug = process.platform === "win32" ? "debug.bat" : "node-debug";
    var debug_process = child_process.spawn(node_debug, ["./src/gauge.js", "--run"],
                                            { env: process.env, stdio: "inherit" });
    debug_process.on("error", function (err) {
      console.log(err.toString());
    });
  } else {
    require("./src/gauge.js").run();
  }
}
