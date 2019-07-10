var assert = require("chai").assert;
var spy = require("sinon").spy;
var gauge = require("../src/gauge-global").gauge;
var screenshot = require("../src/screenshot");
var customScreenshotRegistry = require("../src/custom-screenshot-registry");

describe("Custom Screenshot Registry", () => {
  spy(screenshot, "capture");

  beforeEach(() => {
    screenshot.capture.resetHistory();
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

  it("should pass arguments to capture", () => {
    customScreenshotRegistry.add(1, 2, 3);
    assert(screenshot.capture.getCall(0).calledWithExactly(1, 2, 3), "passed correct arguments");
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
