var vm = require("vm"),
    fs = require("fs"),
    path = require("path"),
    reqman = require("./req-manager");

var VM = function () {
  var self = this;

  self.options = {
    filename: "test",
    dirname: ".",
    filepath: "./test.js",
    displayErrors: true,
    timeout: parseInt(process.env.test_timeout) || 1000,
    root: process.env.GAUGE_PROJECT_ROOT ? process.env.GAUGE_PROJECT_ROOT : process.env.PWD
  };
};

VM.prototype.contextify = function (filePath, root) {
  var self = this;

  filePath = filePath || self.options.filepath;
  root = root || self.options.root;

  self.setFile(filePath);
  self.require = reqman(filePath, root);

  self.context = vm.createContext({
    isVM: true,
    console: console,
    require: self.require.fn,
    module: self.require.mod,
    process: process,
    gauge: global.gauge,
    setTimeout: setTimeout,
    setInterval: setInterval,
    clearTimeout: clearTimeout,
    clearInterval: clearInterval,
    __dirname: self.options.root
  });

};

VM.prototype.run = function (code) {
  vm.runInContext(code, this.context, this.options);
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
