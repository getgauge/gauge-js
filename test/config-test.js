var assert = require("chai").assert;
var config = require("../src/config");

describe("testMatch configuration load", function(){

  it("Should load default testMatch configuration when environment var is not present.", function() {
    var instance  = config.getInstance();

    assert.deepEqual(instance.testMatch, ["**/tests/**/*.js"]);
  });

  it("Should take testMatch config from test_match environment variable.", function() {
    var someValue = "some/value/*.js";
    process.env.test_match = someValue;

    var instance  = config.getInstance();

    assert.deepEqual(instance.testMatch, [someValue]);
  });

  it("Should slice test_match environment variable by ','.", function() {
    var value1 = "**/some/value1/*.js";
    var value2 = "**/some/value2/*.spec.js";
    var value3 = "**/some/value3/*.test.js";

    var valueArray = [value1, value2, value3];

    process.env.test_match = valueArray.join(",");

    var instance  = config.getInstance();

    assert.deepEqual(instance.testMatch, valueArray);
  });

  it("Should trim quots.", function() {
    var value1 = "**/some/value1/*.js";
    var value2 = "**/some/value2/*.spec.js";
    var value3 = "**/some/value3/*.test.js";

    var valueArray = [value1, value2, value3];

    process.env.test_match = "\""+ valueArray.join(",") + "\"";

    var instance  = config.getInstance();

    assert.deepEqual(instance.testMatch, valueArray);
  });

  it("Should trim single quots.", function() {
    var value1 = "**/some/value1/*.js";
    var value2 = "**/some/value2/*.spec.js";
    var value3 = "**/some/value3/*.test.js";

    var valueArray = [value1, value2, value3];

    process.env.test_match = "'"+ valueArray.join(",") + "'";

    var instance  = config.getInstance();

    assert.deepEqual(instance.testMatch, valueArray);
  });

  it("Should trim spaces.", function() {
    var value1 = "**/some/value1/*.js";
    var value2 = "**/some/value2/*.spec.js";
    var value3 = "**/some/value3/*.test.js";

    var valueArray = [value1, value2, value3];

    process.env.test_match = "\" "+ valueArray.join(" , ") + " \"";

    var instance  = config.getInstance();

    assert.deepEqual(instance.testMatch, valueArray);
  });

});
