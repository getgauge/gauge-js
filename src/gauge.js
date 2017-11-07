var Connection = require("./connection");
var impl_loader = require("./impl-loader");
var MessageProcessor = require("./message-processor");
var stepCache = require("./step-cache");
var fileUtil = require("./file-util");
var protobuf = require("protobufjs");
var path = require("path");
var fs = require("fs");

var GAUGE_INTERNAL_PORT = process.env.GAUGE_INTERNAL_PORT;
var GAUGE_PROJECT_ROOT = process.env.GAUGE_PROJECT_ROOT;

function run() {
  protobuf.load(path.resolve("gauge-proto/messages.proto")).then(function(root) {
    var message = root.lookupType("gauge.messages.Message");
    var errorType = root.lookupEnum("gauge.messages.StepValidateResponse.ErrorType");

    var gaugeInternalConnection = new Connection("localhost", GAUGE_INTERNAL_PORT, message);
    gaugeInternalConnection.run();

    impl_loader.load(GAUGE_PROJECT_ROOT);

    fileUtil.getListOfFilesFromPath(path.join(GAUGE_PROJECT_ROOT, "tests")).forEach(function(file){
      var content = fs.readFileSync(file, "UTF-8");
      stepCache.add(file, content);
    });

    var processor = new MessageProcessor({message: message, errorType: errorType});

    gaugeInternalConnection.on("messageReceived", function(decodedData) {
      processor.getResponseFor(decodedData);
    });

    processor.on("messageProcessed", function(response) {
      gaugeInternalConnection.writeMessage(response);
    });

  }).catch(function(e) {
    console.error("Failed while loading proto file.\n", e);
    process.exit();
  });
}

if (process.argv[2] === "--run") {
  run();
}

module.exports= {
  run: run
};
