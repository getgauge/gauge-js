/**
 * Returns the generalised form of a step description.
 * Example:
 * Generalised form of the step "Say <greeting> to <user>" is "Say {} to {}".
 *
 * @param  {[String]} stepName Description of the step.
 * @return {[String]}          Generalised form of the step.
 */
export const generalise = function(stepName) {
  return stepName.replace(/(<.*?>)/g, "{}");
};

export const getParams = function(step) {
  var matches = step.match(/(<.*?>)/g);
  return (matches === null) ? [] : matches.map(function(item) { return item.substring(1, item.length-1); });
};

export const isStepNode = function(node) {
  var isGaugeStepFunction = function (node) {
    return node.callee.object && node.callee.object.name === "gauge" && node.callee.property && node.callee.property.name === "step";
  };
  var isGlobalStepFunction = function (node) {
    return node.callee && node.callee.name === "step";
  };
  return (node && node.type === "CallExpression" && (isGaugeStepFunction(node) || isGlobalStepFunction(node)));
};

export default { generalise, getParams, isStepNode };
