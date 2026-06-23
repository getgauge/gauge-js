import screenshot from "./screenshot.js";

const ScreenshotFactory = function () {
  this.screenshots = [];
};

ScreenshotFactory.prototype.add = function () {
  const bytePromise = screenshot.capture();
  this.screenshots.push(bytePromise);
};

ScreenshotFactory.prototype.get = function () {
  return Promise.all(this.screenshots);
};

ScreenshotFactory.prototype.clear = function () {
  this.screenshots = [];
};

export default new ScreenshotFactory();
