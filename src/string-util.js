var validateIdentifier = require("valid-identifier");

exports = module.exports;

exports.toCamelCase = function (str) {
  return str
    .replace(/\s(.)/g, function ($1) { return $1.toUpperCase(); })
    .replace(/\s/g, "")
    .replace(/^(.)/, function ($1) { return $1.toLowerCase(); });
};

exports.filterInvalidIdentifiers = function (str) {
  var charArray = str.split("");
  return charArray.reduce((accumulator, curVal) => { 
    return validateIdentifier(accumulator + curVal) ? accumulator + curVal : accumulator; 
  });
};