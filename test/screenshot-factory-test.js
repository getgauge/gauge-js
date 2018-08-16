var assert = require("chai").assert;
var gauge = require("../src/gauge-global").gauge;
var customScreenshotRegistry = require("../src/custom-screenshot-registry");

describe("Screenshot Factory", () => {
  beforeEach(() => {
    gauge.screenshotFn = function () {
      return "foo";
    };
    global.gauge = gauge;
  });

  afterEach(() => {
    customScreenshotRegistry.clear();
  });

  it("should add a screenshot", (done) => {
    customScreenshotRegistry.add();
    customScreenshotRegistry.get().then((screenshots) => {
      assert.deepEqual(screenshots, ["foo"]);
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