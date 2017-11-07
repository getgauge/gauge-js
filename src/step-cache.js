var esprima = require("esprima");
var estraverse = require("estraverse");
var parser = require("./step-parser");

var StepCache = function () {
  this.registry = {};
};


var isStepNode = function(node) {
  var isGaugeStepFunction = function(node) {
    return node.callee.object && node.callee.object.name === "gauge" && node.callee.property && node.callee.property.name === "step";
  };
  var isGlobalStepFunction = function(node) {
    return node.callee && node.callee.name === "step";
  };
  return (node.type === "CallExpression" && (isGaugeStepFunction(node) || isGlobalStepFunction(node)));
};


StepCache.prototype.add = function (filePath, fileContent) {
  try {
    var ast = esprima.parse(fileContent, {loc: true});
    var steps = {};
    estraverse.traverse(ast, {
      enter: function (node) {
        if (isStepNode(node)) {
          steps[parser.generalise(node.arguments[0].value)] = {
            line: node.loc.start.line,
            stepText: node.arguments[0].value
          };
        }
      }
    });
    this.registry[filePath] = steps;
  } catch (e) {
    console.log(e);
  }
};

StepCache.prototype.getStepPositions = function(filePath) {
  var stepPositions = [];
  for (var step in this.registry[filePath]) {
    stepPositions.push({stepValue : step, lineNumber: this.registry[filePath][step].line});
  }
  return stepPositions;
};

StepCache.prototype.getStep = function(stepValue) {
  for (var file in this.registry) {
    if (this.registry[file][stepValue]) {
      var step = this.registry[file][stepValue];
      step.filePath = file;
      return step;
    }
  }
};


module.exports = new StepCache();

