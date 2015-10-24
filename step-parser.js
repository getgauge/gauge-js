exports = module.exports;

exports.generalise = function(stepName) {
  return stepName.replace(/(<.*?>)/g, '{}');
};
