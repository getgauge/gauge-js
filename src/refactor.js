/* globals stepRegistry */
var fs = require("fs"),
    esprima = require("esprima"),
    estraverse = require("estraverse"),
    escodegen = require("escodegen");

var refactor_content = function (content, info, req) {

  var ast = esprima.parse(content);
  estraverse.replace(ast, {
    enter: function (node, parent) {
      if (node.type === "CallExpression" && node.callee.name === "gauge" && node.arguments[0].value === info.stepText) {
        node.arguments[0].value = req.newStepValue.parameterizedStepValue;
        if (node.arguments[1] && node.arguments[1].type === "FunctionExpression") {
          var newparams = [];

          req.paramPositions.forEach(function (param) {
            newparams[param.newPosition] = node.arguments[1].params[param.oldPosition];
          });

          node.arguments[1].params = newparams;

        }
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
    console.error(e.toString());
    response.refactorResponse.success = false;
    return response;
  }
  response.refactorResponse.success = true;
  response.refactorResponse.filesChanged.push(info.filePath);
  return response;
};

module.exports = refactor;
