var Q = require('q');

var Test = function(fn, params) {
  this.fn = fn;
  this.params = params;
  this.async = fn.length > params.length;
};

Test.prototype.run = function () {
  var deferred = Q.defer();
  if(this.async) this.params.push( function() {} );

  try {
    this.fn.apply({}, this.params);
    deferred.resolve("Value");
  } catch (e) {
    deferred.reject("Reason");
  } finally {

  }

  return deferred.promise;
};

module.exports = Test;
