var done = function() {

}

var execute = function(fn, params) {
  params.push(function() {
      done();
  });

  try {
    fn.apply({}, params);
    return { result: "success" };
  } catch(e) {
    return { result: "failure", exception: e };
  }
};

module.exports = {
  execute: execute
};
