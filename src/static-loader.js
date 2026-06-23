import fs from "node:fs";
import esprima from "esprima";
import estraverse from "estraverse";
import fileUtil from "./file-util.js";
import stepRegistry from "./step-registry.js";
import stepParser from "./step-parser.js";
import logger from "./logger.js";

function hasAliases(node) {
  return node.type === "ArrayExpression" && !!node.elements.length;
}

function addStep(step, info) {
  stepRegistry.add(step.value, null, info.filePath, info.span, null);
}

function addAliases(aliases, info) {
  stepRegistry.addAlias(aliases.map(function (alias) {
    return alias.value;
  }), null, info.filePath, info.span, null);
}

function processNode(node, filePath) {
  const stepNode = node.arguments[0];
  const span = {
    start: node.loc.start.line,
    end: node.loc.end.line,
    startChar: node.loc.start.column,
    endChar: node.loc.end.column
  };
  try {
    if (hasAliases(stepNode)) {
      addAliases(stepNode.elements, { filePath: filePath, span: span });
    } else if (stepNode.type === "Literal") {
      addStep(stepNode, { filePath: filePath, span: span });
    }
  } catch (e) {
    logger.info(e);
  }
}

function traverser(filePath) {
  return function (node) {
    if (stepParser.isStepNode(node)) {
      processNode(node, filePath);
    }
  };
}

const loadFile = function (filePath, ast) {
  estraverse.traverse(ast, {enter: traverser(filePath)});
};

function createAst(content) {
  try {
    return esprima.parse(content, { loc: true });
  } catch (e) {
    logger.error(e.message);
    return "";
  }
}

function loadFiles(projectRoot) {
  fileUtil.getListOfFiles(projectRoot).forEach(function (filePath) {
    const ast = createAst(fs.readFileSync(filePath, "utf8"));
    if (ast) {
      loadFile(filePath, ast);
    }
  });
}

function unloadFile(filePath) {
  stepRegistry.deleteSteps(filePath);
}

function reloadFile(filePath, content) {
  const ast = createAst(content);
  if (ast) {
    unloadFile(filePath);
    loadFile(filePath, ast);
  }
}

export default {
  load: loadFiles,
  reloadFile: reloadFile,
  unloadFile: unloadFile
};
