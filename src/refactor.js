import fs from "node:fs";
import esprima from "esprima";
import estraverse from "estraverse";
import escodegen from "escodegen";
import stepRegistry from "./step-registry.js";
import stepParser from "./step-parser.js";

const isArrowFunction = function (node) {
  return node.type === "ArrowFunctionExpression";
};

const isFunction = function (node) {
  return (node.type === "FunctionExpression" || isArrowFunction(node));
};

const getParamName = function (index, params) {
  const name = "arg" + index;
  if (!params.includes(name)) {
    return name;
  }
  return getParamName(++index, params);
};

const processNode = function (node, req) {
  const li = node.arguments.length - 1;
  node.arguments[0].value = req.newStepValue.parameterizedStepValue;
  node.arguments[0].raw = "\"" + req.newStepValue.parameterizedStepValue + "\"";
  const asyncParams = node.arguments[li].params.slice(req.oldStepValue.parameters.length);
  const oldParams = node.arguments[li].params.slice(0, req.oldStepValue.parameters.length);
  const newParams = [];
  let i = 0;
  const paramsPositionsSize = req.paramPositions.length;
  for (; i < paramsPositionsSize; i++) {
    const oldPosition = req.paramPositions[i].oldPosition || 0;
    const newPosition = req.paramPositions[i].newPosition || 0;
    if (oldPosition < 0) {
      const paramName = getParamName(i, oldParams.map(function (p) {
        return p.name;
      }));
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
  node.arguments[li].params = node.arguments[li].params.concat(asyncParams);
  return node;
};


const generateSignature = function (oldFunction, newfunction) {
  let signature = newfunction.params.map(function (param) { return escodegen.generate(param); }).join(", ");
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

const getParamDiff = function (oldFunction, newFunction) {
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

const getSignatureDiff = function (newStep, oldStep) {
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

const createDiff = function (oldNode, newNode) {
  const oldStep = oldNode.arguments[0];
  const newStep = newNode.arguments[0];
  const oldFunction = oldNode.arguments[oldNode.arguments.length - 1];
  const newFunction = newNode.arguments[oldNode.arguments.length - 1];
  return [getSignatureDiff(newStep, oldStep), getParamDiff(oldFunction, newFunction)];
};

const refactor_content = function (content, info, req) {
  const ast = esprima.parse(content, {loc: true});
  let diffs = null;
  estraverse.replace(ast, {
    enter: function (node) {
      if (stepParser.isStepNode(node) && node.arguments[0].value === info.stepText) {
        if (!node.arguments[node.arguments.length - 1] || !isFunction(node.arguments[node.arguments.length - 1])) {
          throw new Error("anonymous function expected!");
        }
        const oldNode = JSON.parse(JSON.stringify(node));
        processNode(node, req);
        diffs = createDiff(oldNode, node);
      }
      return node;
    }
  });
  return { content: escodegen.generate(ast), diffs: diffs };
};

const refactor = function (refactorRequest, response) {
  const info = stepRegistry.get(refactorRequest.oldStepValue.stepValue);
  try {
    const content = fs.readFileSync(info.fileLocations[0].filePath, "utf8");
    const refactorInfo = refactor_content(content, info, refactorRequest);
    if (refactorRequest.saveChanges) {
      fs.writeFileSync(info.fileLocations[0].filePath, refactorInfo.content, "utf8");
    }
    const change = {
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

export default refactor;
