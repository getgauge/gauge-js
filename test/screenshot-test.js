import { expect } from "chai";
import screenshot from "../src/screenshot.js";
import child_process from "child_process";
import fs from "fs";
import path from "path";
import sinon from "sinon";
const sandbox = sinon.createSandbox();


function screenshotFunction() {
  return Buffer.from("screentshot").toString("base64");
}

function asyncScreenshotFunction() {
  return Promise.resolve(Buffer.from("screentshot").toString("base64"));
}

describe("screentshot.capture", function () {
  const screenshotsDir = path.join(".gauge", "screenshots");

  this.beforeEach(() => {
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
    it("Should handle rejected promise", function (done) {
      global.gauge = {
        screenshotFn: function () {
          return Promise.reject("Failed to take screenshot");
        }
      };

      screenshot.capture().catch(function (file) {
        expect(file).to.be.equal("Failed to take screenshot");
        done();
      });
    });
    describe("when data is in base64 string", () => {
      it("Should capture screentshot with async function", function (done) {
        sandbox.stub(process.hrtime, "bigint").returns(6767787989089);
        const screenShotFile = "screenshot-6767787989089.png";
        global.gauge = { screenshotFn: asyncScreenshotFunction };
        const writeFileSyncStub = sandbox.stub(fs, "writeFileSync");

        screenshot.capture().then(function (file) {
          const filePath = path.join(screenshotsDir, screenShotFile);
          const expectedArgs = [filePath, Buffer.from("screentshot").toString("base64"), "base64"];
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
          const expectedArgs = [filePath, Buffer.from("screentshot").toString("base64"), "base64"];
          const actualArgs = writeFileSyncStub.getCall(0).args;
          expect(file).to.be.equal(screenShotFile);
          expect(actualArgs).to.be.deep.equal(expectedArgs);
          done();
        });
      });

      describe("when data is in bytes", () => {
        it("Should capture screentshot with function returning a promise", function (done) {
          sandbox.stub(process.hrtime, "bigint").returns(6767787989089);
          const screenShotFile = "screenshot-6767787989089.png";
          global.gauge = { screenshotFn: () => Promise.resolve(Buffer.from("screentshot")) };
          const writeFileSyncStub = sandbox.stub(fs, "writeFileSync");

          screenshot.capture().then(function (file) {
            const filePath = path.join(screenshotsDir, screenShotFile);
            const expectedArgs = [filePath, Buffer.from("screentshot")];
            const actualArgs = writeFileSyncStub.getCall(0).args;
            expect(file).to.be.equal(screenShotFile);
            expect(actualArgs).to.be.deep.equal(expectedArgs);
            done();
          });
        });

        it("Should capture screentshot with function returning screenshot data", function (done) {
          sandbox.stub(process.hrtime, "bigint").returns(6767787989089);
          const screenShotFile = "screenshot-6767787989089.png";
          global.gauge = { screenshotFn: ()=> Buffer.from("screentshot") };
          const writeFileSyncStub = sandbox.stub(fs, "writeFileSync");

          screenshot.capture().then(function (file) {
            const filePath = path.join(screenshotsDir, screenShotFile);
            const expectedArgs = [filePath, Buffer.from("screentshot")];
            const actualArgs = writeFileSyncStub.getCall(0).args;
            expect(file).to.be.equal(screenShotFile);
            expect(actualArgs).to.be.deep.equal(expectedArgs);
            done();
          });
        });
      });
    });

    describe("with custom screenshot writer function", () => {
      afterEach(() => {
        global.gauge = { customScreenshotWriter: null };
      });
      it("Should capture screentshot with function returning a promise", function (done) {
        const screenShotFile = "screenshot-file-1.png";
        global.gauge = {
          customScreenshotWriter: function () {
            return Promise.resolve(screenShotFile);
          }
        };

        screenshot.capture().then(function (file) {
          expect(file).to.be.equal(screenShotFile);
          done();
        });
      });

      it("Should capture screentshot with function returning screenshot file name", function (done) {
        const screenShotFile = "screenshot-file-2.png";
        global.gauge = {
          customScreenshotWriter: function () {
            return screenShotFile;
          }
        };

        screenshot.capture().then(function (file) {
          expect(file).to.be.equal(screenShotFile);
          done();
        });
      });

      it("Should handle rejected promise", function (done) {
        global.gauge = {
          customScreenshotWriter: function () {
            return Promise.reject("Failed to take screenshot");
          }
        };

        screenshot.capture().catch(function (file) {
          expect(file).to.be.equal("Failed to take screenshot");
          done();
        });
      });
    });
  });
});
