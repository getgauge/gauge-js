import path from "node:path";

const Test = function (fn, params, ms) {
  this.fn = fn;
  this.params = params;
  this.async = fn.length > params.length;
  this.start = new Date();
  this.finished = false;
  this.timedOut = false;
  this.ms = ms || 1000;
};

const done = function (err) {
  const self = this;
  if (self.finished || self.timedOut) {
    return;
  }
  self.duration = new Date() - self.start;
  self.finished = true;
  clearTimeout(self.timer);

  if (err) {
    self.reject({
      exception: err,
      duration: self.duration
    });
  } else {
    self.resolve({
      duration: self.duration
    });
  }
};

const resetTimeout = function () {
  const self = this;
  if (self.timer) {
    clearTimeout(self.timer);
  }
  self.timer = setTimeout(function () {
    const errorMsg = self.async ? "Timed out. Number of parameters in the step do not match the number of arguments in the step definition." : "Timed out";
    done.apply(self, [new Error(errorMsg)]);
    self.timedOut = true;
  }, self.ms);
};

const absoluteToRelativePath = function (stack) {
  for (let i = 0; i < stack.length; i++) {
    stack[i] = stack[i].replace(process.env.GAUGE_PROJECT_ROOT + path.sep, "");
  }
  return stack;
};

const chopStackTrace = function (stack, pattern) {
  const limit = stack.findIndex(function (frame) {
    return frame.match(pattern);
  });
  stack = limit > 0 ? stack.slice(0, limit) : stack;
  return absoluteToRelativePath(stack).join("\n");
};

const runFn = function () {
  const self = this;
  try {
    if (!process.env.DEBUGGING) {
      resetTimeout.call(self);
    }
    const res = self.fn.apply({}, self.params);
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

const runFnAsync = function () {
  const self = this;
  self.params.push(function (err) { done.call(self, err); });
  if (!process.env.DEBUGGING) {
    resetTimeout.call(self);
  }
  try {
    self.fn.apply({}, self.params);
  } catch (e) {
    e.stack = e.stack && chopStackTrace(e.stack.split("\n"), /at Test.runFnAsync/);
    done.apply(self, [e ? e : new Error("Undefined error thrown")]);
  }
};

Test.prototype.run = function () {
  const self = this;
  const promise = new Promise(function (resolve, reject) {
    self.resolve = resolve;
    self.reject = reject;
  });
  if (this.async) {
    runFnAsync.call(this);
  }
  else {
    runFn.call(this);
  }
  return promise;
};

export default Test;
