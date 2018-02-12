var assert = require("chai").assert;
var stringUtil = require("../src/string-util");

describe("String util functions", function () {
  it("Should convert string to camel case", function () {
    assert.equal(stringUtil.toCamelCase("Some word"), "someWord");
    assert.equal(stringUtil.toCamelCase("some word"), "someWord");
    assert.equal(stringUtil.toCamelCase("SomeWord with Another"), "someWordWithAnother");
    assert.equal(stringUtil.toCamelCase("someWord"), "someWord");
  });

  it("Should filter invalid javascript identifiers", function () {
    assert.equal(stringUtil.filterInvalidIdentifiers("some word"), "someword");
    assert.equal(stringUtil.filterInvalidIdentifiers("some ^ Word"), "someWord");
    assert.equal(stringUtil.filterInvalidIdentifiers("someWord _With_$?"), "someWord_With_$");
    assert.equal(stringUtil.filterInvalidIdentifiers("some 2 words"), "some2words");
  });
});
