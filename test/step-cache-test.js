var assert = require("chai").assert;
var stepCache = require("../src/step-cache");

describe("Step Cache", function () {
  var filePath = "example.js";
  before(function () {
    stepCache.add(filePath, "\"use strict\";\n" +
      "var assert = require(\"assert\");\n" +
      "var vowels = require(\"./vowels\");\n" +
      "step(\"Vowels in English language are <vowels>.\", function(vowelsGiven) {\n" +
      "  assert.equal(vowelsGiven, vowels.vowelList.join(\"\"));\n" +
      "});\n" +
      "step(\"The word <word> has <number> vowels.\", function(word, number) {\n" +
      "  assert.equal(number, vowels.numVowels(word));\n" +
      "});");
  });

  it("should get step positions", function () {
    var positions = stepCache.getStepPositions(filePath);
    var expectedList = [{ stepValue: "Vowels in English language are {}.", lineNumber: 4 }, { stepValue: "The word {} has {} vowels.", lineNumber: 7 }];
    assert.deepEqual(positions, expectedList);
  });

  it("should get steps for give step value", function () {
    var positions = stepCache.getStep("Vowels in English language are {}.");
    var expected = { stepText: "Vowels in English language are <vowels>.", line: 4, filePath: filePath };
    assert.deepEqual(positions, expected);
  });

});
