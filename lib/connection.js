var ProtoBuf = require("protobufjs");
var ByteBuffer = ProtoBuf.ByteBuffer;
var builder = ProtoBuf.loadProtoFile("gauge-proto/messages.proto");
var message = builder.build("gauge.messages.Message");
var MessageProcessor = require('./message-processor');
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

  this.messageHandler = function (bytes) {
    self.emit('messageReceived');
    var decodedData = codec.decode(bytes);
    var response = MessageProcessor.getResponseFor(decodedData);
    writeMessage(this, response);
  };

  writeMessage = function(socket, response) {
    // console.log("Inside Write Message*********", response.messageType);
    socket.write(codec.encode(response));
  };

  this.socket.on('data', this.messageHandler);
};

util.inherits(ExecutionConnection, EventEmitter);

module.exports = ExecutionConnection;
