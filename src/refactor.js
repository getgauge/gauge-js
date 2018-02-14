var fs = require("fs"),
  esprima = require("esprima"),
  estraverse = require("estraverse"),
  escodegen = require("escodegen"),
  stepRegistry = require("./step-registry"),
  stepParser = require("./step-parser"),
  stringUtil = require("./string-util");

var processNode = function (node, req) {
  node.arguments[0].value = req.newStepValue.parameterizedStepValue;
  node.arguments[0].raw = "\"" + req.newStepValue.parameterizedStepValue + "\"";
  if (node.arguments[1] && node.arguments[1].type === "FunctionExpression") {
    var asyncparams = node.arguments[1].params.slice(req.oldStepValue.parameters.length);
    var oldParams = node.arguments[1].params.slice(0, req.oldStepValue.parameters.length);
    var newParams = [];
    for (var i = 0, paramsPositionsSize = req.paramPositions.length; i < paramsPositionsSize; i++) {
      var oldPosition = req.paramPositions[i].oldPosition || 0;
      var newPosition = req.paramPositions[i].newPosition || 0;
      if (oldPosition < 0) {
        var paramName = stringUtil.toCamelCase("arg " + req.newStepValue.parameters[i]);
        if (paramName == "arg") {
          paramName = paramName + i;
        }
        paramName = stringUtil.filterInvalidIdentifiers(paramName);
        newParams.splice(newPosition, 0, paramName);
      } else {
        newParams.splice(newPosition, 0, oldParams[oldPosition].name);
      }
    }
    node.arguments[1].params = newParams.map(function (param) {
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
    if (request.refactorRequest.saveChanges) {
      fs.writeFileSync(info.fileLocations[0].filePath, content, "utf-8");
    }
    response.refactorResponse.fileChanges.push({ "fileName": info.fileLocations[0].filePath, "fileContent": content });
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
