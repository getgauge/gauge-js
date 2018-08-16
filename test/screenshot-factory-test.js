var assert = require("chai").assert;
var gauge = require("../src/gauge-global").gauge;
var customScreenshotRegistry = require("../src/custom-screenshot-registry");

describe("Screenshot Factory", () => {
  beforeEach( () => {
    gauge.screenshotFn = function () {
      return "foo";
    };
    global.gauge = gauge;
  });
  afterEach( () => {
    customScreenshotRegistry.clear();  
  });
  it("should add a screenshot", () => {
    customScreenshotRegistry.add();
    var screenshots = customScreenshotRegistry.get();
    assert.deepEqual(screenshots, ["foo"]);
  });
  it("should clear the screenshots", () => {
    customScreenshotRegistry.add();
    customScreenshotRegistry.clear();
    var screenshots = customScreenshotRegistry.get();
    assert.deepEqual(screenshots, []);
  });
});