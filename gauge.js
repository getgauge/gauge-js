var connection = require('./connection');
var impl_loader = require('./impl-loader');
require('./gauge-global');

var GAUGE_INTERNAL_PORT = process.env.GAUGE_INTERNAL_PORT;
var GAUGE_PROJECT_ROOT = process.env.GAUGE_PROJECT_ROOT;

function run() {
  impl_loader.load(GAUGE_PROJECT_ROOT);
  new connection('localhost', GAUGE_INTERNAL_PORT).run();
}

module.exports= {
  run: run
}
