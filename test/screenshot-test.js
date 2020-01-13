const expect = require("chai").expect;
const screenshot = require("../src/screenshot");
const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const sandbox = require("sinon").createSandbox();


function screenshotFunction() {
  return Buffer.from("screentshot").toString("base64");
}

function asyncScreenshotFunction() {
  return Promise.resolve(Buffer.from("screentshot").toString("base64"));
}

describe("screentshot.capture", function () {
  const screenshotsDir =  path.join(".gauge", "screenshots");

  this.beforeEach( () => {
    process.env.gauge_screenshots_dir = screenshotsDir;
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe("with default screenshot writer", () => {
    it("should capture screentshot 5769768", function (done) {
      let screenShotFile = "screenshot-21432453.png";
      const spawnSyncStub = sandbox.stub(child_process, "spawnSync").returns({});
      sandbox.stub(process.hrtime, "bigint").returns(21432453);
      screenshot.capture().then(function (file) {
        const filePath = path.join(screenshotsDir, screenShotFile);
        const expectedArgs = ["gauge_screenshot", [filePath]];
        const actualArgs = spawnSyncStub.getCall(0).args;

        expect(file).to.be.equal(screenShotFile);
        expect(actualArgs).to.be.deep.equal(expectedArgs);
        done();
      });
    });
  });

  describe("with custom screenshot grabber function", () => {
    afterEach(function () {
      global.gauge = { screenshotFn: null };
    });
    it("Should capture screentshot with async function", function (done) {
      sandbox.stub(process.hrtime, "bigint").returns(6767787989089);
      const screenShotFile = "screenshot-6767787989089.png";
      global.gauge = { screenshotFn: asyncScreenshotFunction };
      const writeFileSyncStub = sandbox.stub(fs, "writeFileSync");

      screenshot.capture().then(function (file) {
        const filePath = path.join(screenshotsDir, screenShotFile);
        const expectedArgs = [filePath, Buffer.from("screentshot").toString("base64")];
        const actualArgs = writeFileSyncStub.getCall(0).args;
        expect(file).to.be.equal(screenShotFile);
        expect(actualArgs).to.be.deep.equal(expectedArgs);
        done();
      });
    });

    it("Should capture screentshot with sync function", function (done) {
      sandbox.stub(process.hrtime, "bigint").returns(6767787989089);
      const screenShotFile = "screenshot-6767787989089.png";
      global.gauge = { screenshotFn: screenshotFunction };
      const writeFileSyncStub = sandbox.stub(fs, "writeFileSync");

      screenshot.capture().then(function (file) {
        const filePath = path.join(screenshotsDir, screenShotFile);
        const expectedArgs = [filePath, Buffer.from("screentshot").toString("base64")];
        const actualArgs = writeFileSyncStub.getCall(0).args;
        expect(file).to.be.equal(screenShotFile);
        expect(actualArgs).to.be.deep.equal(expectedArgs);
        done();
      });
    });
  });

  describe("with custom screenshot writer function", () => {
    afterEach(() => {
      global.gauge = { customScreenshotWriter: null };
    });
    it("Should capture screentshot with async function", function (done) {
      const screenShotFile = "screenshot-file-1.png";
      global.gauge = { customScreenshotWriter: function() {
        return Promise.resolve(screenShotFile);
      } };

      screenshot.capture().then(function (file) {
        expect(file).to.be.equal(screenShotFile);
        done();
      });
    });

    it("Should capture screentshot with sync function", function (done) {
      const screenShotFile = "screenshot-file-2.png";
      global.gauge = { customScreenshotWriter: function() {
        return screenShotFile;
      } };

      screenshot.capture().then(function (file) {
        expect(file).to.be.equal(screenShotFile);
        done();
      });
    });
  });
});
