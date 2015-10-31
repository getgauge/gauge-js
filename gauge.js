function run() {
  var connection = require('./connection');
  require('./gauge-global');
  require('./impl-loader');
  new connection('localhost', process.env.GAUGE_INTERNAL_PORT).run();
}

module.exports= {
  run: run
}
