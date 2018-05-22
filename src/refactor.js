var fs = require("fs"),
  esprima = require("esprima"),
  estraverse = require("estraverse"),
  escodegen = require("escodegen"),
  stepRegistry = require("./step-registry"),
  stepParser = require("./step-parser");

var isArrowFunction = function (node) {
  return node.type === "ArrowFunctionExpression";
};

var isFunction = function (node) {
  return (node.type === "FunctionExpression" || isArrowFunction(node));
};

var getParamName = function(index, params) {
  var name = "arg" + index;
  if (!params.includes(name)){
    return name;
  }
  return getParamName(++index, params);
};

var processNode = function (node, req) {
  var li = node.arguments.length - 1;
  node.arguments[0].value = req.newStepValue.parameterizedStepValue;
  node.arguments[0].raw = "\"" + req.newStepValue.parameterizedStepValue + "\"";
  var asyncparams = node.arguments[li].params.slice(req.oldStepValue.parameters.length);
  var oldParams = node.arguments[li].params.slice(0, req.oldStepValue.parameters.length);
  var newParams = [];
  for (var i = 0, paramsPositionsSize = req.paramPositions.length; i < paramsPositionsSize; i++) {
    var oldPosition = req.paramPositions[i].oldPosition || 0;
    var newPosition = req.paramPositions[i].newPosition || 0;
    if (oldPosition < 0) {
      var paramName = getParamName(i, oldParams);
      newParams.splice(newPosition, 0, paramName);
    } else {
      newParams.splice(newPosition, 0, oldParams[oldPosition].name);
    }
  }
  node.arguments[li].params = newParams.map(function (param) {
    return {
      type: "Identifier",
      name: param
    };
  });
  node.arguments[li].params = node.arguments[li].params.concat(asyncparams);
  return node;
};


var generateSignature = function (oldFunction, newfunction) {
  var signature = newfunction.params.map(function (param) { return escodegen.generate(param); }).join(", ");
  if (isArrowFunction(oldFunction)) {
    signature = "(" + signature + ") => ";
  } else {
    signature = "function (" + signature + ") ";
  }
  if (oldFunction.async) {
    signature = "async " + signature;
  }
  return signature;
};

var getParamDiff = function (oldFunction, newFunction) {
  return {
    content: generateSignature(oldFunction, newFunction),
    span: {
      start: oldFunction.loc.start.line,
      startChar: oldFunction.loc.start.column,
      end: oldFunction.body.loc.start.line,
      endChar: oldFunction.body.loc.start.column,
    }
  };
};

var getSignatureDiff = function (newStep, oldStep) {
  return {
    content: newStep.raw,
    span: {
      start: oldStep.loc.start.line,
      end: oldStep.loc.end.line,
      startChar: oldStep.loc.start.column,
      endChar: oldStep.loc.end.column,
    }
  };
};

var createDiff = function (oldNode, newNode) {
  var oldStep = oldNode.arguments[0];
  var newStep = newNode.arguments[0];
  var oldFunction = oldNode.arguments[oldNode.arguments.length -1];
  var newFunction = newNode.arguments[oldNode.arguments.length -1];
  return [getSignatureDiff(newStep, oldStep), getParamDiff(oldFunction, newFunction)];
};

var refactor_content = function (content, info, req) {
  var ast = esprima.parse(content, { loc: true });
  var diffs = null;
  estraverse.replace(ast, {
    enter: function (node) {
      if (stepParser.isStepNode(node) && node.arguments[0].value === info.stepText) {
        if (!node.arguments[node.arguments.length - 1] || !isFunction(node.arguments[node.arguments.length - 1])) {
          throw new Error("anonymous function expected!");
        }
        var oldNode = JSON.parse(JSON.stringify(node));
        processNode(node, req);
        diffs = createDiff(oldNode, node);
      }
      return node;
    }
  });
  return { content: escodegen.generate(ast), diffs: diffs };
};

var refactor = function (request, response) {
  var info = stepRegistry.get(request.refactorRequest.oldStepValue.stepValue);
  try {
    var content = fs.readFileSync(info.fileLocations[0].filePath).toString("utf-8");
    var refactorInfo = refactor_content(content, info, request.refactorRequest);
    if (request.refactorRequest.saveChanges) {
      fs.writeFileSync(info.fileLocations[0].filePath, refactorInfo.content, "utf-8");
    }
    var change = {
      "fileName": info.fileLocations[0].filePath,
      "fileContent": refactorInfo.content,
      "diffs": refactorInfo.diffs
    };
    response.refactorResponse.fileChanges.push(change);
  } catch (e) {
    response.refactorResponse.success = false;
    response.refactorResponse.error = e.message;
    return response;
  }
  response.refactorResponse.success = true;
  response.refactorResponse.filesChanged.push(info.fileLocations[0].filePath);
  return response;
};

module.exports = refactor;
