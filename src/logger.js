function _print(level, message, isError = false) {
  var log = isError ? console.error : console.log;
  log(JSON.stringify({ logLevel: level, message: message }));
}

function debug(message) {
  _print("debug", message);
}

function info(message) {
  _print("info", message);
}

function error(message) {
  _print("error", message, true);
}

function fatal(message) {
  _print("fatal", message, true);
  process.exit(1);
}

export default {
  debug: debug, info: info, error: error, fatal: fatal
};
