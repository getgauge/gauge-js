var path = require("path");
var fs = require("fs");
var esprima = require("esprima");
var estraverse = require("estraverse");
var escodegen = require("escodegen");

var fileUtil = require("./file-util");
var stepRegistry = require("./step-registry");
var stepParser = require("./step-parser");

function hasAliases(node) {
  return node.type === "ArrayExpression" && !!node.elements.length;
}

function addAliases(aliases, info) {
  for (var i = 0; i < aliases.length; i++) {
    if (!aliases[i].value.length) {
      throw new Error("Step text cannot be empty");
    }
    stepRegistry.add(stepParser.generalise(aliases[i].value), aliases[i].value, null, info.filePath, info.line, null);
  }
}

function processNode(node, filePath) {
  var stepNode = node.arguments[0];
  if (hasAliases(stepNode)) {
    addAliases(stepNode.elements, {filePath: filePath, line: node.loc.start.line});
  } else if (stepNode.type === "Literal") {
    stepRegistry.add(stepParser.generalise(stepNode.value), stepNode.value, null, filePath, node.loc.start.line, null);
  }
}

function traverser(filePath) {
  return function(node) {
    if (stepParser.isStepNode(node)) {
      processNode(node, filePath);
    }
  };
}

var loadFile = function (filePath, content) {
  try{
    var ast = esprima.parse(content, { loc: true });
    estraverse.traverse(ast, {enter : traverser(filePath)});
    return escodegen.generate(ast);
  }catch(e){
    console.log(e);
  }
};

function loadFiles(projectRoot) {
  fileUtil.getListOfFilesFromPath(path.join(projectRoot, "tests")).forEach(function (filePath) {
    loadFile(filePath, fs.readFileSync(filePath).toString("utf-8"));
  });
}

function unloadFile(filePath) {
  stepRegistry.deleteSteps(filePath);
}

function reloadFile(filePath, content) {
  unloadFile(filePath);
  loadFile(filePath,content);
}

module.exports = {
  load: loadFiles,
  loadFile: loadFile,
  reloadFile: reloadFile
};
