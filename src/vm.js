var vm = require("vm"),
    fs = require("fs"),
    path = require("path");

var VM = function () {
  this.context = vm.createContext({
    console: console,
    require: require,
    gauge: global.gauge,
    process: process,
    setTimeout: setTimeout,
    setInterval: setInterval
  });

  this.options = { filename: "test", displayErrors: true };
};

VM.prototype.run = function (code) {
  vm.runInNewContext(code, this.context, this.options);
};

VM.prototype.runFile = function (filePath) {
  this.options.filename = path.basename(filePath);
  this.run(fs.readFileSync(filePath).toString("utf-8"));
};

module.exports = VM;
