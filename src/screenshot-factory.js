var screenshot = require("./screenshot");

var ScreenshotFactory = function () {
  this.screenshots = [];
};
  
ScreenshotFactory.prototype.add = function () {
  var screenshotFn = global.gauge && global.gauge.screenshotFn && typeof global.gauge.screenshotFn === "function" ? global.gauge.screenshotFn : screenshot;
  this.screenshots.push(screenshotFn());
};

ScreenshotFactory.prototype.get = function () {
  return this.screenshots;
};

ScreenshotFactory.prototype.clear = function () {
  this.screenshots = [];
};

module.exports = new ScreenshotFactory();
