var HookRegistry = function () {
  this.registry = {};
};

var InvalidHookException = function (message) {
  this.message = message;
  this.name = "InvalidHookException";
};

HookRegistry.prototype.types = [
  "beforeSuite",
  "afterSuite",
  "beforeSpec",
  "afterSpec",
  "beforeScenario",
  "afterScenario",
  "beforeStep",
  "afterStep"
];

HookRegistry.prototype.add = function (hookName, hookFn, options, filePath) {
  if (!hookName) {
    throw new InvalidHookException("Need a hook name");
  }

  if (this.types.indexOf(hookName) < 0) {
    throw new InvalidHookException("Invalid hook name: " + hookName);
  }

  this.registry[hookName] = this.registry[hookName] || [];
  this.registry[hookName].push({ "fn": hookFn, "options": options, "filePath": filePath });
};

HookRegistry.prototype.get = function (hookName) {
  return hookName ? (this.registry[hookName] ? this.registry[hookName] : []) : this.registry;
};

HookRegistry.prototype.clear = function () {
  this.registry = {};
};

HookRegistry.prototype.clearFile = function (filePath) {
  var isNotDefinedInFile = function (h) {
    return h.filePath !== filePath;
  };
  for (var hook in this.registry) {
    this.registry[hook] = this.registry[hook].filter(isNotDefinedInFile);
  }
};

module.exports = new HookRegistry();
