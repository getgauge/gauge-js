
var execute = function(fn, params, callback) {
  var timedOut = false;
  var async = fn.length > params.length;

  var done = function(err) {
    if(!err) {
      callback({ result: "success" });
    }
    else {
      callback({ result: "failure", exception: err });
    }
  };

  if(async) {
    params.push(function() { done() });
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
