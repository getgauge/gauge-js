var Connection = require("./connection");
var MessageProcessor = require("./message-processor");
var protobuf = require("protobufjs");
var path = require("path");
var loader = require("./static-loader");
var consoleStamp = require("console-stamp");

var GAUGE_INTERNAL_PORT = process.env.GAUGE_INTERNAL_PORT;

function run() {
  if (process.env.IS_DAEMON) {
    consoleStamp(console, { label: false, pattern: "HH:MM:ss.l", datePrefix: "", dateSuffix: "" });
  }
  protobuf.load(path.resolve("gauge-proto/messages.proto")).then(function (root) {
    var message = root.lookupType("gauge.messages.Message");
    var errorType = root.lookupEnum("gauge.messages.StepValidateResponse.ErrorType");
    var fileStatus = root.lookupEnum("gauge.messages.CacheFileRequest.FileStatus");
    return { message: message, errorType: errorType, fileStatus: fileStatus };
  }).catch(function (e) {
    console.error("Failed while loading runner.\n", e);
    process.exit();
  }).then(function (types) {
    var gaugeInternalConnection = new Connection("localhost", GAUGE_INTERNAL_PORT, types.message);
    gaugeInternalConnection.run();

    loader.load();

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
  }).catch(function (e) {
    console.error(e);
  });
}

if (process.argv[2] === "--run") {
  run();
}

module.exports = {
  run: run
};
