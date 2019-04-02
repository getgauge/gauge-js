var gaugeGlobal = require("./gauge-global");
var protobuf = require("protobufjs");
var path = require("path");
var loader = require("./static-loader");
var consoleStamp = require("console-stamp");
var Connection = require("./connection");
var MessageProcessor = require("./message-processor").MessageProcessor;
// var PROTO_PATH = __dirname + "/../gauge-proto/lsp.proto";
// var grpc = require("grpc");
// var lspProto = grpc.load(PROTO_PATH).gauge.messages;
// var LspServerHandler = require("./lsp-server");
var tracker = require("./tracker.js");
const { Worker, workerData, isMainThread } = require("worker_threads");

var GAUGE_INTERNAL_PORT = process.env.GAUGE_INTERNAL_PORT;

if (isMainThread) {
  global.gauge = gaugeGlobal.gauge;
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
    // if (process.env.GAUGE_LSP_GRPC) {
    //   var server = new grpc.Server();
    //   server.addService(lspProto.lspService.service, new LspServerHandler(server, types));
    //   var p = server.bind("127.0.0.1:0", grpc.ServerCredentials.createInsecure());
    //   console.log("Listening on port:" + p);
    //   server.start();
    //   tracker.trackLSP();
    // } else {
    tracker.trackConsole();
    var portInfo = process.env.GAUGE_API_PORTS;
    console.log("portInfo : ", portInfo);
    console.log("types : ", types);
    if (portInfo !== undefined && portInfo !== null && !portInfo.trim().isEmpty()) {
      portInfo.forEach(port => {
        const w = new Worker(__filename, { workerData: {"port" : port, "types" : types }});
        w.on("message", (args) => console.log("got message from worker", args));
        w.on("error", (args) => console.log("got error from worker", args));
        w.on("exit", (code) => {
          if (code !== 0) {
            new Error(`Worker stopped with exit code ${code}`);
          }
        });
      });
    }
    else {
      console.log("port : ", GAUGE_INTERNAL_PORT);
      console.log("filename : ", __filename);
      const w = new Worker(__filename, { workerData: {"port" : GAUGE_INTERNAL_PORT, "types" : types }});
      w.on("message", (args) => console.log("got message from worker", args));
      w.on("error", (args) => console.log("got error from worker", args));
      w.on("exit", (code) => {
        if (code !== 0) {
          new Error(`Worker stopped with exit code ${code}`);
        }
      });
    }
    // }
  }).catch(function (e) {
    console.error(e);
  });
} else {
  console.log("worker.............");

  // console.log("port : ", workerData.types.message);
  
  console.log(workerData.types.message.decodeDelimited);
  var gaugeInternalConnection = new Connection("127.0.0.1", workerData.port, workerData.types.message);
  gaugeInternalConnection.run();
  var processor = new MessageProcessor(workerData.types);
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

// if (process.argv[2] === "--run"){
//   module.exports.run();
// }
