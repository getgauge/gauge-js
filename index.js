#! /usr/bin/env node

const minNodeVersion = 18;
const version = process.versions.node.split(".");
if (Number.parseInt(version[0]) < minNodeVersion) {
  throw new Error(
    `gauge-js requires Node.js version ${minNodeVersion}+. Current version: ${process.versions.node}`,
  );
}

import child_process from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const skeldir = path.join(__dirname, "skel");
const srcdir = path.join(process.env.GAUGE_PROJECT_ROOT, "tests");
const envdir = path.join(process.env.GAUGE_PROJECT_ROOT, "env", "default");
const testCode = "step_implementation.js";
const jsPropertyFile = "js.properties";

if (process.argv[2] === "--init") {
  console.log("Initialising Gauge JavaScript project");
  fs.mkdir(srcdir, 484, (err) => {
    if (err && err.code !== "EEXIST") {
      console.error(err);
    } else {
      fs.createReadStream(path.join(skeldir, testCode)).pipe(
        fs.createWriteStream(path.join(srcdir, testCode)),
      );
    }
  });

  fs.mkdir(path.dirname(envdir), 484, (err) => {
    if (err && err.code !== "EEXIST") {
      console.error(err);
    } else {
      fs.mkdir(envdir, 484, (err) => {
        if (err && err.code !== "EEXIST") {
          console.error(err);
        } else {
          fs.createReadStream(path.join(skeldir, jsPropertyFile)).pipe(
            fs.createWriteStream(path.join(envdir, jsPropertyFile)),
          );
        }
      });
    }
  });
} else if (process.argv[2] === "--start") {
  let args = ["./src/gauge.js", "--run"];
  if (process.env.gauge_nodejs_args) {
    args = process.env.gauge_nodejs_args.split(" ").concat(args);
  }
  const cmd = process.env.gauge_nodejs_bin || "node";
  const runner = child_process.spawn(cmd, args, {
    env: process.env,
    silent: false,
    stdio: "inherit",
  });
  process.on("beforeExit", (code) => {
    try {
      if (!runner.killed) {
        runner.kill("SIGINT");
      }
    } finally {
      process.exit(code);
    }
  });
  runner.on("error", (err) => {
    console.trace(err.stack);
  });
}
