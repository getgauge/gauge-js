#! /usr/bin/env nod

const version = process.versions.node.split(".");
if (parseInt(version[0]) < 16) {
  throw new Error("gauge-js requires Node.js version 16+. Current version: " + process.versions.node);
}

import fs from "fs";
import path from "path";
import child_process from "child_process";

const skeldir = path.join(__dirname, "skel"),
  srcdir = path.join(process.env.GAUGE_PROJECT_ROOT, "tests"),
  envdir = path.join(process.env.GAUGE_PROJECT_ROOT, "env", "default"),
  testCode = "step_implementation.js",
  jsPropertyFile = "js.properties";

if (process.argv[2] === "--init") {

  console.log("Initialising Gauge JavaScript project");
  fs.mkdir(srcdir, 484, function (err) {
    if (err && err.code !== "EEXIST") {
      console.error(err);
    } else {
      fs.createReadStream(path.join(skeldir, testCode))
        .pipe(fs.createWriteStream(path.join(srcdir, testCode)));
    }
  });

  fs.mkdir(path.dirname(envdir), 484, function (err) {
    if (err && err.code !== "EEXIST") {
      console.error(err);
    } else {
      fs.mkdir(envdir, 484, function (err) {
        if (err && err.code !== "EEXIST") {
          console.error(err);
        } else {
          fs.createReadStream(path.join(skeldir, jsPropertyFile))
            .pipe(fs.createWriteStream(path.join(envdir, jsPropertyFile)));
        }
      });
    }
  });
}

else if (process.argv[2] === "--start") {
  let args = ["./src/gauge.js", "--run"];
  if (process.env.gauge_nodejs_args) {
    args = process.env.gauge_nodejs_args.split(" ").concat(args);
  }
  const cmd = process.env.gauge_nodejs_bin || "node";
  const runner = child_process.spawn(cmd, args, {env: process.env, silent: false, stdio: "inherit"});
  process.on("beforeExit", (code) => {
    try {
      if (!runner.killed) { runner.kill("SIGINT"); }
    } finally {
      process.exit(code);
    }
  });
  runner.on("error", function (err) {
    console.trace(err.stack);
  });
}
