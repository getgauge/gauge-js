var DataStore = function () {
  this.store = {};
};

DataStore.prototype.put = function (key, val) {
  this.store[key] = val;
};

DataStore.prototype.get = function (key) {
  return this.store.hasOwnProperty(key) ? this.store[key] : null;
};

DataStore.prototype.clear = function () {
  this.store = {};
};

var DataStoreFactory = function () {

  this.suiteStore = new DataStore();
  this.specStore = new DataStore();
  this.scenarioStore = new DataStore();

};

module.exports = new DataStoreFactory();
