var fs = require("fs");
var esprima = require("esprima");
var estraverse = require("estraverse");

var fileUtil = require("./file-util");
var stepRegistry = require("./step-registry");
var stepParser = require("./step-parser");

const config = require("./config");

function hasAliases(node) {
  return node.type === "ArrayExpression" && !!node.elements.length;
}

function addAliases(aliases, info) {
  for (var i = 0; i < aliases.length; i++) {
    if (!aliases[i].value.length) {
      throw new Error("Step text cannot be empty");
    }
    stepRegistry.add(stepParser.generalise(aliases[i].value), aliases[i].value, null, info.filePath, info.span, null);
  }
}

function processNode(node, filePath) {
  var stepNode = node.arguments[0];
  var span = { start: node.loc.start.line, end: node.loc.end.line };
  if (hasAliases(stepNode)) {
    addAliases(stepNode.elements, { filePath: filePath, span: span });
  } else if (stepNode.type === "Literal") {
    stepRegistry.add(stepParser.generalise(stepNode.value), stepNode.value, null, filePath, span, null);
  }
}

function traverser(filePath) {
  return function (node) {
    if (stepParser.isStepNode(node)) {
      processNode(node, filePath);
    }
  };
}

var loadFile = function (filePath, ast) {
  estraverse.traverse(ast, { enter: traverser(filePath) });
};

function createAst(content) {
  try {
    return esprima.parse(content, { loc: true });
  } catch (e) {
    console.error(e.message);
    return "";
  }
}

function loadFiles(projectRoot) {
  const configObject = config.readConfig(projectRoot);
  fileUtil.getListOfFilesFromPath(projectRoot, configObject).forEach(function (filePath) {
    var ast = createAst(fs.readFileSync(filePath, "UTF-8"));
    if (ast) {
      loadFile(filePath, ast);
    }
  });
}

function unloadFile(filePath) {
  stepRegistry.deleteSteps(filePath);
}

function reloadFile(filePath, content) {
  var ast = createAst(content);
  if (ast) {
    unloadFile(filePath);
    loadFile(filePath, ast);
  }
}

module.exports = {
  load: loadFiles,
  loadFile: loadFile,
  reloadFile: reloadFile,
  unloadFile: unloadFile
};
