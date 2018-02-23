var util = require("util");
var EventEmitter = require("events").EventEmitter;

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
    self.emit("messageReceived", self.message.decodeDelimited(bytes));
  };

  var errorHandler = function (err) {
    self.emit("socketError", err);
  }
  this.writeMessage = function(response) {
    self.socket.write(self.message.encodeDelimited(self.message.create(response)).finish());
  };

  this.socket.on("data", messageHandler);
  this.socket.on("error", errorHandler);
};

util.inherits(ExecutionConnection, EventEmitter);

module.exports = ExecutionConnection;
