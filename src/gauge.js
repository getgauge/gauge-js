var gaugeGlobal = require("./gauge-global");
var Connection = require("./connection");
var MessageProcessor = require("./message-processor").MessageProcessor;
var protobuf = require("protobufjs");
var path = require("path");
var loader = require("./static-loader");
var PROTO_PATH = __dirname + "/../gauge-proto/lsp.proto";
var grpc, lspProto;
var config = require("../package.json").config || {};
if (config.hasPureJsGrpc) {
  grpc = require("@grpc/grpc-js");
  const protoLoader = require("@grpc/proto-loader");
  const packageDefinition = protoLoader.loadSync(PROTO_PATH);
  lspProto = grpc.loadPackageDefinition(packageDefinition).gauge.messages;
} else {
  grpc = require("grpc");
  lspProto = grpc.load(PROTO_PATH).gauge.messages;
}
var LspServerHandler = require("./lsp-server");
var logger = require("./logger");

var GAUGE_INTERNAL_PORT = process.env.GAUGE_INTERNAL_PORT;

function run() {
  global.gauge = gaugeGlobal.gauge;
  protobuf.load(path.resolve("gauge-proto/messages.proto")).then(function (root) {
    var message = root.lookupType("gauge.messages.Message");
    var errorType = root.lookupEnum("gauge.messages.StepValidateResponse.ErrorType");
    var fileStatus = root.lookupEnum("gauge.messages.CacheFileRequest.FileStatus");
    return { message: message, errorType: errorType, fileStatus: fileStatus };
  }).catch(function (e) {
    logger.error("Failed while loading runner.\n" + e);
    process.exit();
  }).then(function (types) {
    loader.load();
    if (process.env.GAUGE_LSP_GRPC) {
      var server = new grpc.Server();
      server.addService(lspProto.lspService.service, new LspServerHandler(server, types));
      if (config.hasPureJsGrpc) {
        server.bindAsync("127.0.0.1:0", grpc.ServerCredentials.createInsecure(), (err, port) => {
          if (!err) {
            logger.info("Listening on port:" + port);
            server.start();
          } else {
            logger.error(err);
            process.exit();
          }
        });
      } else {
        var p = server.bind("127.0.0.1:0", grpc.ServerCredentials.createInsecure());
        logger.info("Listening on port:" + p);
        server.start();
      }
    } else {
      var portInfo = process.env.GAUGE_API_PORTS;
      if (portInfo !== undefined && portInfo !== null && portInfo.trim() !== "") {
        portInfo = portInfo.split(",");
      } else {
        portInfo = [GAUGE_INTERNAL_PORT];
      }
      var socketsCount = portInfo.length;
      portInfo.forEach(port => {
        var gaugeInternalConnection = new Connection("127.0.0.1", port, types.message);
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
        processor.on("closeSocket", function () {
          socketsCount--;
          gaugeInternalConnection.closeSocket();
          if (socketsCount === 0) {
            process.exit();
          }
        });
      });
    }
  }).catch(function (e) {
    logger.error(e);
  });
}

if (process.argv[2] === "--run") {
  run();
}

module.exports = {
  run: run
};
