var vm = require("vm"),
  fs = require("fs"),
  path = require("path"),
  reqman = require("./req-manager"),
  gaugeGlobal = require("./gauge-global");

var VM = function () {
  var self = this;

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
  var self = this;

  filePath = filePath || self.options.filepath;
  root = root || self.options.root;

  self.setFile(filePath);
  self.require = reqman(filePath, root);
  var sandbox = {
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
  for (var type in gaugeGlobal.hooks) {
    sandbox[type] = gaugeGlobal.hooks[type];
  }

  self.context = vm.createContext(sandbox);
};

VM.prototype.run = function (code) {
  try {
    const oldNodeModulesPaths = module.constructor._nodeModulePaths;
    module.constructor._nodeModulePaths = function () {
      const ret = oldNodeModulesPaths.apply(this, arguments);
      ret.push(path.join(this.options.root,"node_modules"));
      return ret;
    };
    vm.runInContext(code +  "\n//# sourceURL="+ this.options.filepath, this.context, this.options);
  } catch (e) {
    console.error("Error executing " + this.options.filename);
    console.trace(e.stack);
  }
};

VM.prototype.setFile = function (filePath) {
  this.options.filepath = filePath;
  this.options.filename = path.relative(this.options.root, filePath);
  this.options.dirname = path.dirname(filePath);
};

VM.prototype.runFile = function (filePath) {
  this.setFile(filePath);
  this.run(fs.readFileSync(filePath).toString("utf-8"));
};

module.exports = VM;
