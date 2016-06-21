var mod = require("module"),
    path = require("path");

var Req = function (filepath, root) {
  this.Module = mod.Module;
  this.root = root;
  this.filepath = filepath || null;
  this.nativeModules = [
    "assert", "buffer", "child_process", "constants",  "crypto", "tls", "dgram", "dns", "http", "https",
    "net", "querystring", "url", "domain", "events", "fs", "path", "os", "punycode", "stream", "string_decoder",
    "timers", "tty", "util", "sys", "vm", "zlib"
  ];
};

Req.prototype.load = function (modname) {
  var self = this;

  var cachedModule = self.Module._cache[self.filepath];
  if (cachedModule) {
    return cachedModule.exports;
  }

  return (function (self, mod, modname) {
    if (self.nativeModules.indexOf(modname) < 0) {
      modname = path.normalize(modname);
    }
    var m = new mod.Module(self.filepath, mod.Module);
    m.paths = [
      path.dirname(self.filepath),
      path.join(self.root, "node_modules")
    ].concat(module.paths.filter(function (p) { return p.indexOf(".gauge") < 0; }));
    try {
      return m.require(modname);
    } catch (e) {
      console.error("Unable to require module '" + modname + "' in " + self.filepath);
      console.trace(e.stack);
      return null;
    }
  })(self, mod, modname);
};

var reqman = function (filepath, root) {

  var req = new Req(filepath, root);
  return {
    mod: req.Module,
    exports: req.Module.exports || {},
    fn: (function (req) {
      return function (modname) {
        return req.load(modname);
      };
    })(req)
  };
};

module.exports = reqman;
