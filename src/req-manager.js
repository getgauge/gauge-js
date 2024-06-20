import fs from "node:fs";
import mod from "node:module";
import path from "node:path";
import logger from "./logger.js";

const require = mod.createRequire(import.meta.url); // eslint-disable-line

const Req = function(filepath, root) {
  this.Module = mod.Module;
  this.root = root;
  this.filepath = filepath || null;
  this.nativeModules = [
    "assert",
    "buffer",
    "child_process",
    "constants",
    "crypto",
    "tls",
    "dgram",
    "dns",
    "http",
    "https",
    "net",
    "querystring",
    "url",
    "domain",
    "events",
    "fs",
    "path",
    "os",
    "punycode",
    "stream",
    "string_decoder",
    "timers",
    "tty",
    "util",
    "sys",
    "vm",
    "zlib",
  ];
};

Req.prototype.load = function(modname) {
  const cachedModule = this.Module._cache[this.filepath];
  if (cachedModule) {
    return cachedModule.exports;
  }

  return ((self, mod, modname) => {
    if (!modname.startsWith("./") && self.nativeModules.indexOf(modname) < 0) {
      modname = path.normalize(modname);
    }
    const m = new mod.Module(self.filepath, mod.Module);
    m.paths = [
      path.dirname(self.filepath),
      path.join(self.root, "node_modules"),
    ].concat(require.resolve.paths("").filter((p) => p.indexOf(".gauge") < 0));
    try {
      if (modname === path.basename(modname)) {
        return m.require(modname);
      }
      const relativePath = path.join(path.dirname(self.filepath), modname);
      if (fs.existsSync(relativePath)) {
        return m.require(relativePath);
      }
      if (fs.existsSync(relativePath.concat(".js"))) {
        return m.require(relativePath.concat(".js"));
      }
      return m.require(modname);
    } catch (e) {
      logger.error(
        `Unable to require module '${modname}' in ${self.filepath}\n${e.stack}`,
      );
      return null;
    }
  })(this, mod, modname);
};

const reqman = (filepath, root) => {
  const req = new Req(filepath, root);
  return {
    mod: req.Module,
    exports: req.Module.exports || {},
    fn: (
      (req) => (modname) =>
        req.load(modname)
    )(req),
  };
};

export default reqman;
