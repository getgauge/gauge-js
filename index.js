#! /usr/bin/env node

var fs = require("fs"),
    path = require("path");

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
  require("./src/gauge").run();
}
