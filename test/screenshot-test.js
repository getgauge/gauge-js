var expect = require("chai").expect;
var screenshot = require("../src/screenshot");


function screenshotFunction(...args) {
  return Buffer.from(...args).toString("base64");
}

function asyncScreenshotFunction(...args) {
  return Promise.resolve(Buffer.from(...args).toString("base64"));
}

describe("screenshot.capture", function () {

  it("Should capture screenshot and return base64 string", function (done) {
    global.gauge = { screenshotFn: screenshotFunction };
    screenshot.capture("tempFile").then(function (bytes) {
      expect(Buffer.from(bytes, "base64").toString("ascii")).to.equal("tempFile");
      done();
    });
  });

  it("Should capture screenshot with async custom screenshot function", function (done) {
    global.gauge = { screenshotFn: asyncScreenshotFunction };
    screenshot.capture("tempFile").then(function (bytes) {
      expect(Buffer.from(bytes, "base64").toString("ascii")).to.equal("tempFile");
      done();
    });
  });
});
