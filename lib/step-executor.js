
var execute = function(fn, params) {
  fn.apply({}, params);
};

module.exports = {
  execute: execute
};
