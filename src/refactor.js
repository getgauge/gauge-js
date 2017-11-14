var fs = require("fs"),
    esprima = require("esprima"),
    estraverse = require("estraverse"),
    escodegen = require("escodegen"),
    stepRegistry = require("./step-registry"),
    stepParser = require("./step-parser");

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

var refactor_content = function (content, info, req) {
  var ast = esprima.parse(content);
  estraverse.replace(ast, {
    enter: function (node) {
      if (stepParser.isStepNode(node) && node.arguments[0].value === info.stepText) {
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
    var content = fs.readFileSync(info.fileLocations[0].filePath).toString("utf-8");
    content = refactor_content(content, info, request.refactorRequest);
    fs.writeFileSync(info.fileLocations[0].filePath, content, "utf-8");
  } catch (e) {
    response.refactorResponse.success = false;
    response.refactorResponse.error = e.toString();
    return response;
  }
  response.refactorResponse.success = true;
  response.refactorResponse.filesChanged.push(info.fileLocations[0].filePath);
  return response;
};

module.exports = refactor;
