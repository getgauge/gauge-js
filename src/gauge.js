global.gauge = require("./gauge-global");

var Connection = require("./connection");
var impl_loader = require("./impl-loader");
var MessageProcessor = require("./message-processor");

var GAUGE_INTERNAL_PORT = process.env.GAUGE_INTERNAL_PORT;
var GAUGE_PROJECT_ROOT = process.env.GAUGE_PROJECT_ROOT;

function run() {
  var gaugeInternalConnection = new Connection("localhost", GAUGE_INTERNAL_PORT);
  gaugeInternalConnection.run();

  gaugeInternalConnection.on("messageReceived", function(decodedData) {
    MessageProcessor.getResponseFor(decodedData);
  });

  MessageProcessor.on("messageProcessed", function(response) {
    gaugeInternalConnection.writeMessage(response);
  });

  impl_loader.load(GAUGE_PROJECT_ROOT);
}

if (process.argv[2] === "--run") {
  run();
}

module.exports= {
  run: run
};
