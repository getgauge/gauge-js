import screenshot from "./screenshot.js";

var ScreenshotFactory = function () {
  this.screenshots = [];
};

ScreenshotFactory.prototype.add = function () {
  var bytePromise = screenshot.capture();
  this.screenshots.push(bytePromise);
};

ScreenshotFactory.prototype.get = function () {
  return Promise.all(this.screenshots);
};

ScreenshotFactory.prototype.clear = function () {
  this.screenshots = [];
};

export default new ScreenshotFactory();
