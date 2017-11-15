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

HookRegistry.prototype.add = function (hookName, hookFn, options) {
  if (!hookName) {
    throw new InvalidHookException("Need a hook name");
  }

  if (this.types.indexOf(hookName) < 0) {
    throw new InvalidHookException("Invalid hook name: " + hookName);
  }

  this.registry[hookName] = this.registry[hookName] || [];
  this.registry[hookName].push({"fn": hookFn, "options": options});
};

HookRegistry.prototype.get = function (hookName) {
  return this.registry[hookName] ? this.registry[hookName] : [];
};

HookRegistry.prototype.clear = function () {
  this.registry = {};
};

module.exports = new HookRegistry();
