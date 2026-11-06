import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import reqman from "./req-manager.js";
import gaugeGlobal from "./gauge-global.js";
import sourceParser from "./source-parser.js";
import logger from "./logger.js";

const VM = function () {
  const self = this;

  self.options = {
    filename: "test",
    dirname: ".",
    filepath: path.join(".", "test.js"),
    displayErrors: true,
    timeout: parseInt(process.env.test_timeout) || 1000,
    root: process.env.GAUGE_PROJECT_ROOT ? process.env.GAUGE_PROJECT_ROOT : process.cwd()
  };
};

VM.prototype.contextify = function (filePath, root) {
  const self = this;

  filePath = filePath || self.options.filepath;
  root = root || self.options.root;

  self.setFile(filePath);
  self.require = reqman(filePath, root);
  const sandbox = {
    isVM: true,
    console: console,
    __dirname: path.dirname(path.resolve(filePath)),
    __filename: path.resolve(filePath),
    require: self.require.fn,
    module: self.require.mod,
    exports: self.require.exports,
    process: process,
    gauge: gaugeGlobal.gauge,
    step: gaugeGlobal.step,
    setImmediate: setImmediate,
    setInterval: setInterval,
    setTimeout: setTimeout,
    clearImmediate: clearImmediate,
    clearInterval: clearInterval,
    clearTimeout: clearTimeout,
    gauge_runner_root: process.cwd(),
    gauge_project_root: self.options.root
  };
  for (let type in gaugeGlobal.hooks) {
    sandbox[type] = gaugeGlobal.hooks[type];
  }

  self.context = vm.createContext(sandbox);
};

VM.prototype.run = function (code) {
  try {
    vm.runInContext("(function () { process.chdir(gauge_project_root); })()", this.context, this.options);
    vm.runInContext(code + "\n//# sourceURL=" + this.options.filepath, this.context, this.options);
  } catch (e) {
    logger.fatal("Error executing " + this.options.filename + "\n" + e.stack);
  }
};

VM.prototype.setFile = function (filePath) {
  this.options.filepath = filePath;
  this.options.filename = path.relative(this.options.root, filePath);
  this.options.dirname = path.dirname(filePath);
};

VM.prototype.runFile = function (filePath) {
  this.setFile(filePath);
  const code = fs.readFileSync(filePath, "utf8");
  if (sourceParser.isModule(code)) {
    return this.importModule(filePath);
  }
  this.run(code);
};

// An ES module cannot run inside a vm context, so Node imports it into the
// runner itself, with the globals the context would have provided.
VM.prototype.importModule = function (filePath) {
  const self = this;
  Object.assign(globalThis, gaugeGlobal.hooks, { gauge: gaugeGlobal.gauge, step: gaugeGlobal.step });
  process.chdir(self.options.root);
  return import(pathToFileURL(path.resolve(filePath)).href).catch(function (e) {
    logger.fatal("Error executing " + self.options.filename + "\n" + e.stack);
  });
};

export default VM;
