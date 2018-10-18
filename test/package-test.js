var assert = require("chai").assert;

describe("Package", function () {

  var packageJSON = require("../package.json"),
    jsJSON = require("../js.json");

  describe("version", function () {

    it("should be same in package.json and js.json", function () {
      assert.equal(packageJSON.version, jsJSON.version);
    });

  });

  describe("name", function () {

    it("should be gauge-<id> where <id> equals <id> in js.json", function () {
      assert.equal(packageJSON.name, "gauge-" + jsJSON.id);
    });

  });

});
