const gaugeGlobal = require("./gauge-global");
const protobuf = require("protobufjs");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const loader = require("./static-loader");
const PROTO_PATH = __dirname + "/../gauge-proto/services.proto";
const grpc = require("@grpc/grpc-js");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const servicesProto = grpc.loadPackageDefinition(packageDefinition).gauge.messages;

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
    server.bindAsync("127.0.0.1:0", grpc.ServerCredentials.createInsecure(), (err, port) => {
      if (!err) {
        logger.info("Listening on port:" + port);
        server.start();
      } else {
        logger.error(err);
        process.exit();
      }
    });
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
