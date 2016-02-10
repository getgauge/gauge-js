/* globals stepRegistry */
var fs = require("fs"),
    grasp = require("grasp");

var refactor_content = function (content, info, req) {
  var searchstr = "gauge(_str[value=\"{}\"], $fn)".replace("{}", info.stepText);
  var replacestr = "gauge(\"{}\", {{fn}})".replace("{}", req.newStepValue.parameterizedStepValue);

  content = grasp.replace("equery", searchstr, replacestr, content);
  return content;
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
