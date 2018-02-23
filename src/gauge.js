var Connection = require("./connection");
var MessageProcessor = require("./message-processor");
var protobuf = require("protobufjs");
var path = require("path");
var loader = require("./static-loader");

var GAUGE_INTERNAL_PORT = process.env.GAUGE_INTERNAL_PORT;
var GAUGE_PROJECT_ROOT = process.env.GAUGE_PROJECT_ROOT;

function run() {
  protobuf.load(path.resolve("gauge-proto/messages.proto")).then(function (root) {
    var message = root.lookupType("gauge.messages.Message");
    var errorType = root.lookupEnum("gauge.messages.StepValidateResponse.ErrorType");
    return {message: message, errorType: errorType};
  }).catch(function (e) {
    console.error("Failed while loading runner.\n", e);
    process.exit();
  }).then(function(types){
    var gaugeInternalConnection = new Connection("localhost", GAUGE_INTERNAL_PORT, types.message);
    gaugeInternalConnection.run();

    loader.load(GAUGE_PROJECT_ROOT);

    var processor = new MessageProcessor(types);

    gaugeInternalConnection.on("messageReceived", function (decodedData) {
      processor.getResponseFor(decodedData);
    });

    gaugeInternalConnection.on("socketError", function (err) {
      throw err;
    });

    processor.on("messageProcessed", function (response) {
      gaugeInternalConnection.writeMessage(response);
    });
  }).catch(function(e){
    console.error(e);
  });
}

if (process.argv[2] === "--run") {
  run();
}

module.exports = {
  run: run
};
