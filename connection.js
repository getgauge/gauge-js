var ProtoBuf = require("protobufjs");
var ByteBuffer = ProtoBuf.ByteBuffer;
var builder = ProtoBuf.loadProtoFile("./gauge-proto/messages.proto");
var message = builder.build("gauge.messages.Message");
var MessageProcessor = require('./message-processor');

var encode = function (data) {
    var payload = data.encode().toBuffer();
    // prefix message length
    var messageLengthByteBuffer = new ByteBuffer(ByteBuffer.calculateVarint64(payload.length));
    var length = messageLengthByteBuffer.writeVarint64(payload.length).flip().toBuffer();
    return ByteBuffer.concat([length, payload]).toBuffer();
};


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
        var response = MessageProcessor.getResponseFor(decodedData);
        writeMessage(this, response);
    };

    writeMessage = function(socket, response) {
        // console.log("Inside Write Message*********", response.messageType);
        socket.write(encode(response));
    };

    this.socket.on('data', this.messageHandler);
};

module.exports = ExecutionConnection;
