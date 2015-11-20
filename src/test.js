var Q = require('q');

var Test = function(fn, params) {
  this.fn = fn;
  this.params = params;
  this.async = fn.length > params.length;
  this.start = new Date();
  this.finished = false;
};

var done = function(err) {
  var self = this;

  if(self.finished) return;
  self.duration = new Date() - self.start;
  self.finished = true;

  if(err) {
    self.deferred.reject({
      exception: err,
      duration: self.duration
    });
    return;
  } else{
    self.deferred.resolve({
      duration: self.duration
    });
    return;
  }
};

var runFn = function() {
  var self = this;
  try {
    self.fn.apply({}, self.params);
    done.call(self);
  } catch (e) {
    var exception = e ? e : new Error('Undefined error thrown');
    done.apply(this, [exception]);
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
