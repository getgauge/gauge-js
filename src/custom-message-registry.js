var CustomMessageRegistry = function () {
  this.messages = [];
};

CustomMessageRegistry.prototype.add = function (msg) {
  this.messages.push(msg);
  return this.messages;
};

CustomMessageRegistry.prototype.get = function () {
  return this.messages;
};

CustomMessageRegistry.prototype.clear = function () {
  this.messages = [];
  return this.messages;
};

module.exports = CustomMessageRegistry;
