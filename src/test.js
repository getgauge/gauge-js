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
  try {
    this.fn.apply({}, this.params);
    done.call(this);
  } catch (e) {
    this.deferred.reject("Reason");
  }
};

var runFnAsync = function() {
  var self = this;
  this.params.push( function() { done.call(self); } );
  this.fn.apply({}, this.params);
};

Test.prototype.run = function () {
  this.deferred = Q.defer();
  this.async ? runFnAsync.call(this) : runFn.call(this);
  return this.deferred.promise;
};

module.exports = Test;
