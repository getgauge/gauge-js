# Custom screenshot hook

You can specify a custom function to grab a screenshot on step failure. By default, `gauge-js` takes screenshot of the current screen using the `gauge_screenshot` binary.

This custom function should be set on the `gauge.screenshotFn` property in test implementation code and it should return a base64 encoded string of the image data that `gauge-js` will use as image content on failure.

```js
gauge.screenshotFn = function () {
  return "base64encodedstring";
};
```
