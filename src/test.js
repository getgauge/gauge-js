var Q = require("q");

var Test = function (fn, params, ms) {
  this.fn = fn;
  this.params = params;
  this.async = fn.length > params.length;
  this.start = new Date();
  this.finished = false;
  this.timedOut = false;
  this.ms = ms || 1000;
};

var done = function (err) {
  var self = this;
  if (self.finished || self.timedOut) {
    return;
  }
  self.duration = new Date() - self.start;
  self.finished = true;
  clearTimeout(self.timer);

  if (err) {
    self.deferred.reject({
      exception: err,
      duration: self.duration
    });
    return;
  } else {
    self.deferred.resolve({
      duration: self.duration
    });
    return;
  }
};

var resetTimeout = function () {
  var self = this;
  if (self.timer) {
    clearTimeout(self.timer);
  }
  self.timer = setTimeout(function () {
    done.apply(self, [new Error("Timed out")]);
    self.timedOut = true;
  }, self.ms);
};

var chopStackTrace = function (stack, pattern) {
  var limit = stack.findIndex(function (frame) {
    return frame.match(pattern);
  });
  return stack.slice(0, limit).join("\n");
};

var runFn = function () {
  var self = this;
  try {
    resetTimeout.call(self);
    var res = self.fn.apply({}, self.params);
    if (Object.prototype.toString.call(res) === "[object Promise]") {
      res.then(function () {
        done.call(self);
      }).catch(function (e) {
        e.stack = e.stack && chopStackTrace(e.stack.split("\n"), /at Test.runFn/);
        done.apply(self, [e ? e : new Error("Undefined error thrown")]);
      });
      return;
    }
    done.call(self);
  } catch (e) {
    e.stack = e.stack && chopStackTrace(e.stack.split("\n"), /at Test.runFn/);
    done.apply(self, [e ? e : new Error("Undefined error thrown")]);
  }
};

var runFnAsync = function () {
  var self = this;
  self.params.push(function (err) { done.call(self, err); });
  resetTimeout.call(self);
  try {
    self.fn.apply({}, self.params);
  } catch (e) {
    e.stack = e.stack && chopStackTrace(e.stack.split("\n"), /at Test.runFnAsync/);
    done.apply(self, [e ? e : new Error("Undefined error thrown")]);
  }
};

Test.prototype.run = function () {
  this.deferred = Q.defer();
  if (this.async) {
    runFnAsync.call(this);
  }
  else {
    runFn.call(this);
  }
  return this.deferred.promise;
};

module.exports = Test;
