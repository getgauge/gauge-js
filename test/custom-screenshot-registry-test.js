import { assert } from "chai";
import sinon from "sinon";
import screenshot from "../src/screenshot.js";
import customScreenshotRegistry from "../src/custom-screenshot-registry.js";

const sandbox = sinon.createSandbox();

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
