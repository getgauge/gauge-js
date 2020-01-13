var assert = require("chai").assert;
var sandbox = require("sinon").createSandbox();
var screenshot = require("../src/screenshot");
var customScreenshotRegistry = require("../src/custom-screenshot-registry");

describe("Custom Screenshot Registry", () => {
  beforeEach(() => {
    sandbox.stub(screenshot, "capture")
      .returns(Promise.resolve("screenshot-file.png"));
  });

  afterEach(() => {
    sandbox.restore();
    customScreenshotRegistry.clear();
  });

  it("should add a screenshot", (done) => {
    customScreenshotRegistry.add();
    customScreenshotRegistry.get().then((screenshots) => {
      assert.deepEqual(screenshots, ["screenshot-file.png"]);
      done();
    });
  });

  it("should clear the screenshots", (done) => {
    customScreenshotRegistry.add();
    customScreenshotRegistry.clear();
    customScreenshotRegistry.get().then((screenshots) => {
      assert.deepEqual(screenshots, []);
      done();
    });
  });
});