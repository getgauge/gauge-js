var assert = require("chai").assert;
var gauge = require("../src/gauge-global").gauge;
var screenshotFactory = require("../src/screenshot-factory");

describe("Screenshot Factory", () => {
  beforeEach( () => {
    gauge.screenshotFn = function () {
      return "foo";
    };
    global.gauge = gauge;
  });
  afterEach( () => {
    screenshotFactory.clear();  
  });
  it("should add a screenshot", () => {
    screenshotFactory.add();
    var screenshots = screenshotFactory.get();
    assert.deepEqual(screenshots, ["foo"]);
  });
  it("should clear the screenshots", () => {
    screenshotFactory.add();
    screenshotFactory.clear();
    var screenshots = screenshotFactory.get();
    assert.deepEqual(screenshots, []);
  });
});