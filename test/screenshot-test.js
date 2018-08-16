var expect = require("chai").expect;
var screenshot = require("../src/screenshot");


function screenshotFunction() {
  return Buffer.from("screentshot").toString("base64");
}

function asyncScreenshotFunction() {
  return Promise.resolve(Buffer.from("screentshot").toString("base64"));
}

describe("screentshot.capture", function () {

  it("Should capture screentshot and return base64 string", function (done) {
    global.gauge = { screenshotFn: screenshotFunction };
    screenshot.capture().then(function (bytes) {
      expect(Buffer.from(bytes).toString(), "screentshot");
      done();
    });
  });

  it("Should capture screentshot with async custom screenshot function", function (done) {
    global.gauge = { screenshotFn: asyncScreenshotFunction };
    screenshot.capture().then(function (bytes) {
      expect(Buffer.from(bytes).toString(), "screentshot");
      done();
    });
  });
});
