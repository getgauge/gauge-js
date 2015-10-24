exports = module.exports;

/**
 * Returns the generalised form of a step description.
 * Example:
 * Generalised form of the step "Say <greeting> to <user>" is "Say {} to {}".
 *
 * @param  {[String]} stepName Description of the step.
 * @return {[String]}          Generalised form of the step.
 */
exports.generalise = function(stepName) {
  return stepName.replace(/(<.*?>)/g, '{}');
};
