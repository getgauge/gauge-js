var fs = require("fs"),
    esprima = require("esprima"),
    estraverse = require("estraverse"),
    escodegen = require("escodegen"),
    stepRegistry = require("./step-registry");

var processNode = function (node, req) {
  node.arguments[0].value = req.newStepValue.parameterizedStepValue;
  node.arguments[0].raw = "\"" + req.newStepValue.parameterizedStepValue + "\"";
  if (node.arguments[1] && node.arguments[1].type === "FunctionExpression") {
    var asyncparams = node.arguments[1].params.slice(req.oldStepValue.parameters.length);
    node.arguments[1].params = req.newStepValue.parameters.map(function (param) {
      return {
        type: "Identifier",
        name: param
      };
    });
    node.arguments[1].params = node.arguments[1].params.concat(asyncparams);
  }
  return node;
};

var isStepNode = function(node) {
  var isGaugeStepFunction = function (node) {
    return node.callee.object && node.callee.object.name === "gauge" && node.callee.property && node.callee.property.name === "step";
  };
  var isGlobalStepFunction = function (node) {
    return node.callee && node.callee.name === "step";
  };
  return (node.type === "CallExpression" && (isGaugeStepFunction(node) || isGlobalStepFunction(node)));
};

var refactor_content = function (content, info, req) {
  var ast = esprima.parse(content);
  estraverse.replace(ast, {
    enter: function (node) {
      if (isStepNode(node)) {
        node = processNode(node, req);
      }
      return node;
    }
  });
  return escodegen.generate(ast);
};

var refactor = function (request, response) {
  var info = stepRegistry.get(request.refactorRequest.oldStepValue.stepValue);
  try {
    var content = fs.readFileSync(info.filePath).toString("utf-8");
    content = refactor_content(content, info, request.refactorRequest);
    fs.writeFileSync(info.filePath, content, "utf-8");
  } catch (e) {
    response.refactorResponse.success = false;
    response.refactorResponse.error = e.toString();
    return response;
  }
  response.refactorResponse.success = true;
  response.refactorResponse.filesChanged.push(info.filePath);
  return response;
};

module.exports = refactor;
