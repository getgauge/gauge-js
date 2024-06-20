import { assert } from "chai";
import { readFileSync } from "fs";

describe("Package", function () {

  const packageJSON = JSON.parse(readFileSync("./package.json"));
  const jsJSON = JSON.parse(readFileSync("./js.json"));

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
