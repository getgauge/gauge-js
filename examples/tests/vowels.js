/**
 * Use `module.exports` to export an object which can be used with a `require()` on this file.
 */

var vowelList = ["a", "e", "i", "o", "u"];

var numVowels = function (word) {
  var vowelArr = word.split("").filter(function (elem) { return vowelList.indexOf(elem) > -1; });
  return vowelArr.length;
};

module.exports = {
  vowelList: vowelList,
  numVowels: numVowels
};
