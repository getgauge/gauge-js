var grpc = require("grpc");
var PROTO_PATH = __dirname + "/../gauge-proto/lsp.proto";
var lspProto = grpc.load(PROTO_PATH).gauge.messages;
var LspServerHandler = require("./lsp-server");
var tracker = require("./tracker.js");
var protobuf = require("protobufjs");
var path = require("path");

function run(){
  protobuf.load(path.resolve("gauge-proto/messages.proto")).then(function (root) {
    var message = root.lookupType("gauge.messages.Message");
    var errorType = root.lookupEnum("gauge.messages.StepValidateResponse.ErrorType");
    var fileStatus = root.lookupEnum("gauge.messages.CacheFileRequest.FileStatus");
    return { message: message, errorType: errorType, fileStatus: fileStatus };
  }).catch(function (e) {
    console.error("Failed while loading runner.\n", e);
    process.exit();
  }).then(function (types) {
    var server = new grpc.Server();
    server.addService(lspProto.lspService.service, new LspServerHandler(server, types));
    var p = server.bind("127.0.0.1:0", grpc.ServerCredentials.createInsecure());
    console.log("Listening on port:" + p);
    server.start();
    tracker.trackLSP();
  });
}
run();