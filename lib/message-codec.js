var ProtoBuf = require("protobufjs");
var ByteBuffer = ProtoBuf.ByteBuffer;
var builder = ProtoBuf.loadProtoFile("gauge-proto/messages.proto");
var message = builder.build("gauge.messages.Message");

var exports = module.exports;

exports.encode = function(data) {
  var payload = data.encode().toBuffer();
  // prefix message length
  var messageLengthByteBuffer = new ByteBuffer(ByteBuffer.calculateVarint64(payload.length));
  var length = messageLengthByteBuffer.writeVarint64(payload.length).flip().toBuffer();
  return ByteBuffer.concat([length, payload]).toBuffer();
};

exports.decode = function(bytes) {
  var byteBuffer = ByteBuffer.wrap(bytes);
  var messageLength = byteBuffer.readVarint64(0);
  var data = bytes.slice(messageLength.length, messageLength.value.low + messageLength.length);
  var decodedData = message.decode(data);
  return decodedData;
};
