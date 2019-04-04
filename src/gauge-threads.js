var gaugeGlobal = require("./gauge-global");
var protobuf = require("protobufjs");
var path = require("path");
var loader = require("./static-loader");
var consoleStamp = require("console-stamp");
var Connection = require("./connection");
var MessageProcessor = require("./message-processor").MessageProcessor;
var tracker = require("./tracker.js");
const { Worker, workerData, isMainThread } = require("worker_threads");

var GAUGE_INTERNAL_PORT = process.env.GAUGE_INTERNAL_PORT;

if (isMainThread) {
  if (process.env.IS_DAEMON) {
    consoleStamp(console, { label: false, pattern: "HH:MM:ss.l", datePrefix: "", dateSuffix: "" });
  }
  tracker.trackConsole();
  var portInfo = process.env.GAUGE_API_PORTS;
  if (portInfo !== undefined && portInfo !== null && portInfo.trim() !== "") {
    portInfo = portInfo.split(",");
    portInfo.forEach(port => {
      const w = new Worker(__filename, { workerData: {"port" : port}});
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
    const w = new Worker(__filename, { workerData: {"port" : GAUGE_INTERNAL_PORT}});
    w.on("message", (args) => console.log("got message from worker", args));
    w.on("error", (args) => console.log("got error from worker", args));
    w.on("exit", (code) => {
      if (code !== 0) {
        new Error(`Worker stopped with exit code ${code}`);
      }
    });
  }
} else {
  global.gauge = gaugeGlobal.gauge;
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
    var gaugeInternalConnection = new Connection("127.0.0.1", workerData.port, types.message);
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
  }).catch(function (e) {
    console.error(e);
  });
}
