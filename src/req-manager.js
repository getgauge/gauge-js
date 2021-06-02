var mod = require("module"),
  path = require("path"),
  fs = require("fs"),
  logger = require("./logger");

var Req = function (filepath, root) {
  this.Module = mod.Module;
  this.root = root;
  this.filepath = filepath || null;
  this.nativeModules = [
    "assert", "buffer", "child_process", "constants", "crypto", "tls", "dgram", "dns", "http", "https",
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
    if (!modname.startsWith("./") && self.nativeModules.indexOf(modname) < 0) {
      modname = path.normalize(modname);
    }
    var m = new mod.Module(self.filepath, mod.Module);
    m.paths = [
      path.dirname(self.filepath),
      path.join(self.root, "node_modules")
    ].concat(module.paths.filter(function (p) { return p.indexOf(".gauge") < 0; }));
    try {
      if (modname === path.basename(modname)) {
        return m.require(modname);
      }
      let relativePath = path.join(path.dirname(self.filepath), modname);
      if (fs.existsSync(relativePath)) {
        return m.require(relativePath);
      }
      if (fs.existsSync(relativePath.concat(".js"))) {
        return m.require(relativePath.concat(".js"));
      }
      return m.require(modname);
    } catch (e) {
      logger.error("Unable to require module '" + modname + "' in " + self.filepath + "\n" + e.stack);
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
