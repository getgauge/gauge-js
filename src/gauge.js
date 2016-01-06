var connection = require("./connection");
var impl_loader = require("./impl-loader");
require("./gauge-global");
var MessageProcessor = require("./message-processor");

var GAUGE_INTERNAL_PORT = process.env.GAUGE_INTERNAL_PORT;
var GAUGE_PROJECT_ROOT = process.env.GAUGE_PROJECT_ROOT;

function run() {
  impl_loader.load(GAUGE_PROJECT_ROOT);
  console.log("Initializing Connection");

  var gaugeInternalConnection = new connection("localhost", GAUGE_INTERNAL_PORT);
  gaugeInternalConnection.run();

  gaugeInternalConnection.on("messageReceived", function(decodedData) {
    MessageProcessor.getResponseFor(decodedData);
  });

  MessageProcessor.on("messageProcessed", function(response) {
    gaugeInternalConnection.writeMessage(response);
  });
}

module.exports= {
  run: run
};
