var screenshot = require("./screenshot");

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

module.exports = new ScreenshotFactory();
