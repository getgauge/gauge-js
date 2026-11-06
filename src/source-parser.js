import esprima from "esprima";

// A step implementation file is a script unless it only parses as an ES module.
const looksLikeModule = /^\s*(import|export)\b/m;

function parse(content, options) {
  try {
    return { ast: esprima.parseScript(content, options), sourceType: "script" };
  } catch (scriptError) {
    try {
      return { ast: esprima.parseModule(content, options), sourceType: "module" };
    } catch (moduleError) {
      throw looksLikeModule.test(content) ? moduleError : scriptError;
    }
  }
}

// Falls back to the file's shape for syntax esprima does not know, so that
// Node still gets to report the error for the right kind of file.
function isModule(content) {
  try {
    return parse(content).sourceType === "module";
  } catch {
    return looksLikeModule.test(content);
  }
}

export default { parse, isModule };
