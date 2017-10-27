var CacheRegistry = function () {
  this.registry = {};
};

CacheRegistry.prototype.add = function (filePath, fileContent) {
  this.registry[filePath] = fileContent;
};

CacheRegistry.prototype.get = function (filePath) {
  return this.registry[filePath];
};

CacheRegistry.prototype.delete = function (filePath) {
  delete this.registry[filePath];
};

module.exports = new CacheRegistry();

