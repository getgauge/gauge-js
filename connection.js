var ProtoBuf = require("protobufjs");
var ByteBuffer = ProtoBuf.ByteBuffer;
var builder = ProtoBuf.loadProtoFile("./gauge-proto/messages.proto");
var message = builder.build("gauge.messages.Message");

var ExecutionConnection = function (host, port) {
    this.host = host;
    this.port = port;
    this.socket = require('net').Socket();
    this.run = function () {
        this.socket.connect(this.port, this.host);
    };
    this.messageHandler = function (bytes) {
        var byteBuffer = ByteBuffer.wrap(bytes);
        var messageLength = byteBuffer.readVarint64(0);
        var data = bytes.slice(messageLength.length, messageLength.value.low + messageLength.length);
        var decodedData = message.decode(data);
        console.log(decodedData.messageType);
    };
    this.socket.on('data', this.messageHandler);
};

module.exports = ExecutionConnection;