import path from "node:path";
import { fileURLToPath } from "node:url";
import protoLoader from "@grpc/proto-loader";
import protobuf from "protobufjs";
import gaugeGlobal from "./gauge-global.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import loader from "./static-loader.js";
const PROTO_PATH = `${__dirname}/../gauge-proto/services.proto`;
import grpc from "@grpc/grpc-js";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const servicesProto =
  grpc.loadPackageDefinition(packageDefinition).gauge.messages;

import logger from "./logger.js";
import ServiceHandlers from "./serviceHandlers.js";

function run() {
  global.gauge = gaugeGlobal.gauge;
  protobuf
    .load(path.resolve("gauge-proto/messages.proto"))
    .then((root) => {
      const errorType = root.lookupEnum(
        "gauge.messages.StepValidateResponse.ErrorType",
      );
      const fileStatus = root.lookupEnum(
        "gauge.messages.CacheFileRequest.FileStatus",
      );
      return { errorType: errorType, fileStatus: fileStatus };
    })
    .catch((e) => {
      logger.error(`Failed while loading runner.\n${e}`);
      process.exit();
    })
    .then((types) => {
      loader.load();
      const server = new grpc.Server();
      server.addService(
        servicesProto.Runner.service,
        new ServiceHandlers(server, types),
      );
      server.bindAsync(
        "127.0.0.1:0",
        grpc.ServerCredentials.createInsecure(),
        (err, port) => {
          if (!err) {
            logger.info(`Listening on port:${port}`);
          } else {
            logger.error(err);
            process.exit();
          }
        },
      );
    })
    .catch((e) => {
      logger.error(`${e.message}\n${e.stack}`);
    });
}

if (process.argv[2] === "--run") {
  run();
}

export default {
  run: run,
};
