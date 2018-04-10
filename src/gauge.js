var Connection = require("./connection");
var MessageProcessor = require("./message-processor").MessageProcessor;
var protobuf = require("protobufjs");
var path = require("path");
var loader = require("./static-loader");
var consoleStamp = require("console-stamp");
var PROTO_PATH = __dirname + "/../gauge-proto/lsp.proto";
var grpc = require("grpc");
var lspProto = grpc.load(PROTO_PATH).gauge.messages;
var LspServerHandler = require("./lsp-server");

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

    loader.load();

    if (process.env.GAUGE_LSP_GRPC) {
      var server = new grpc.Server();
      server.addService(lspProto.lspService.service, new LspServerHandler(server, types));
      var p = server.bind("127.0.0.1:0", grpc.ServerCredentials.createInsecure());
      console.log("Listening on port:", p);
      server.start();
    } else {
      var gaugeInternalConnection = new Connection("127.0.0.1", GAUGE_INTERNAL_PORT, types.message);
      gaugeInternalConnection.run();
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
    }
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
