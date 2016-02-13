var assert = require("chai").assert,
    screenshot = require("../src/screenshot");

// Source: https://github.com/chriso/validator.js/blob/master/validator.js
var base64 = /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i;

describe("Screenshot", function () {

  it("should take screenshot and return base64", function () {
    var imgstr = screenshot();
    assert(base64.test(imgstr));
  });

});
