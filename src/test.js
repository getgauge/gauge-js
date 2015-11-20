var Q = require('q');

var Test = function(fn, params) {
  this.fn = fn;
  this.params = params;
  this.async = fn.length > params.length;
};

var done = function() {
  this.deferred.resolve("Value");
};

var runFn = function() {
  var self = this;
  try {
    self.fn.apply({}, self.params);
    done.call(self);
  } catch (e) {
    self.deferred.reject("Reason");
  }
};

var runFnAsync = function() {
  var self = this;
  self.params.push( function() { done.call(self); } );
  self.fn.apply({}, self.params);
};

Test.prototype.run = function () {
  this.deferred = Q.defer();
  this.async ? runFnAsync.call(this) : runFn.call(this);
  return this.deferred.promise;
};

module.exports = Test;
