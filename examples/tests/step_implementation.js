/* globals gauge*/

"use strict";

/**
 * Loads the `assert` module provided by NodeJS
 */
import assert from "node:assert";

/**
 * Loads the local `vowels.js` module present in this directory
 */
import vowels from "./vowels.js";


// --------------------------
// Gauge step implementations
// --------------------------

gauge.step("Vowels in English language are <vowels>.", function(vowelsGiven) {
  assert.equal(vowelsGiven, vowels.vowelList.join(""));
});

gauge.step("The word <word> has <number> vowels.", function(word, number) {
  assert.equal(number, vowels.numVowels(word));
});

gauge.step("Almost all words have vowels <table>", function(table) {
  table.rows.forEach(function (row) {
    assert.equal(vowels.numVowels(row.cells[0]), parseInt(row.cells[1]));
  });
});

// ---------------
// Execution Hooks
// ---------------

gauge.hooks.beforeScenario(function () {
  assert.equal(vowels.vowelList.join(""), "aeiou");
});

gauge.hooks.beforeScenario(function () {
  assert.equal(vowels.vowelList[0], "a");
}, { tags: [ "single word" ]});
