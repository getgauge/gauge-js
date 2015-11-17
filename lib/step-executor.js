
var execute = function(fn, params, callback) {
  var timedOut = false;
  var async = fn.length > params.length;
  var finished = false;

  var done = function(err) {
    if(finished) return;

    if(!err && !timedOut) {
      callback({ result: "success" });
    }
    else {
      callback({ result: "failure", exception: err });
    }

    finished = true;
  };

  if(async) {
    params.push(function() { done() });
    setTimeout(function() {
      timedOut = true;
      done();
    }, 1500);

    fn.apply({}, params);
  }
  else {
    try {
      fn.apply({}, params);
      done();
    } catch(e) {
      done(e);
    }
  }
};

module.exports = {
  execute: execute
};
