var gaugeGlobal = require("./gauge-global");
var protobuf = require("protobufjs");
var path = require("path");
var loader = require("./static-loader");
var PROTO_PATH = __dirname + "/../gauge-proto/services.proto";
var grpc, servicesProto;
var config = require("../package.json").config || {};
if (config.hasPureJsGrpc) {
  grpc = require("@grpc/grpc-js");
  const protoLoader = require("@grpc/proto-loader");
  const packageDefinition = protoLoader.loadSync(PROTO_PATH);
  servicesProto = grpc.loadPackageDefinition(packageDefinition).gauge.messages;
} else {
  grpc = require("grpc");
  servicesProto = grpc.load(PROTO_PATH).gauge.messages;
}
var ServiceHandlers = require("./serviceHandlers");
var logger = require("./logger");

function run() {
  global.gauge = gaugeGlobal.gauge;
  protobuf.load(path.resolve("gauge-proto/messages.proto")).then(function (root) {
    var errorType = root.lookupEnum("gauge.messages.StepValidateResponse.ErrorType");
    var fileStatus = root.lookupEnum("gauge.messages.CacheFileRequest.FileStatus");
    return { errorType: errorType, fileStatus: fileStatus };
  }).catch(function (e) {
    logger.error("Failed while loading runner.\n" + e);
    process.exit();
  }).then(function (types) {
    loader.load();
    var server = new grpc.Server();
    server.addService(servicesProto.Runner.service, new ServiceHandlers(server, types));
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
  }).catch(function (e) {
    logger.error(`${e.message}\n${e.stack}`);
  });
}

if (process.argv[2] === "--run") {
  run();
}

module.exports = {
  run: run
};
