var util = require("util");
var EventEmitter = require("events").EventEmitter;
var reader = require("protobufjs").Reader;

var ExecutionConnection = function (host, port, message) {
  EventEmitter.call(this);
  var self = this;
  this.host = host;
  this.port = port;
  this.message = message;
  this.socket = require("net").Socket();

  this.run = function () {
    this.socket.connect(this.port, this.host);
  };

  var messageHandler = function (bytes) {
    var r = reader.create(Buffer.from(bytes));
    while (r.pos < r.len) {
      console.log("message ---------- : ",  self.message);
      self.emit("messageReceived", self.message.decodeDelimited(r));
    }
  };

  var errorHandler = function (err) {
    self.emit("socketError", err);
  };

  this.writeMessage = function (response) {
    self.socket.write(self.message.encodeDelimited(self.message.create(response)).finish());
  };

  this.socket.on("data", messageHandler);
  this.socket.on("error", errorHandler);
};

util.inherits(ExecutionConnection, EventEmitter);

module.exports = ExecutionConnection;
