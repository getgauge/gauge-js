var ProtoBuf = require("protobufjs");
var ByteBuffer = ProtoBuf.ByteBuffer;
var builder = ProtoBuf.loadProtoFile("gauge-proto/messages.proto");
var message = builder.build("gauge.messages.Message");
var events = require('events');
var util = require("util");
var EventEmitter = require('events').EventEmitter;
var codec = require('./message-codec');

var ExecutionConnection = function (host, port) {
  EventEmitter.call(this);
  var self = this;
  this.host = host;
  this.port = port;
  this.socket = require('net').Socket();

  this.run = function () {
    this.socket.connect(this.port, this.host);
  };

  var messageHandler = function (bytes) {
    var decodedData = codec.decode(bytes);
    self.emit('messageReceived', decodedData);
  };

  this.writeMessage = function(response) {
    this.socket.write(codec.encode(response));
  };

  this.socket.on('data', messageHandler);
};

util.inherits(ExecutionConnection, EventEmitter);

module.exports = ExecutionConnection;
