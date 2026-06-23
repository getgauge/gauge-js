/* globals gauge, step, beforeScenario */

"use strict";

/**
 * Loads the `assert` module provided by NodeJS
 */
const assert = require("assert");

/**
 * Loads the local `vowels.js` module present in this directory
 */
const vowels = require("./vowels");


// --------------------------
// Gauge step implementations
// --------------------------

step("Vowels in English language are <vowels>.", function(vowelsGiven) {
  assert.equal(vowelsGiven, vowels.vowelList.join(""));
});

step("The word <word> has <number> vowels.", function(word, number) {
  assert.equal(number, vowels.numVowels(word));
});

step("Almost all words have vowels <table>", function(table) {
  table.rows.forEach(function (row) {
    assert.equal(vowels.numVowels(row.cells[0]), parseInt(row.cells[1]));
  });
});

// ---------------
// Execution Hooks
// ---------------

beforeScenario(function () {
  assert.equal(vowels.vowelList.join(""), "aeiou");
});

beforeScenario(function () {
  assert.equal(vowels.vowelList[0], "a");
}, { tags: [ "single word" ]});
