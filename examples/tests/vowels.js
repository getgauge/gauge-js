const vowelList = ["a", "e", "i", "o", "u"];

const numVowels = function (word) {
  const vowelArr = word.split("").filter(function (elem) {
    return vowelList.indexOf(elem) > -1;
  });
  return vowelArr.length;
};

export default {
  vowelList: vowelList,
  numVowels: numVowels
};
