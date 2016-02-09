/* globals stepRegistry */
var fs = require("fs");

var refactor_content = function (content, info, req) {
  // TODO: implement actual content replace based on refactorRequest
  console.log(info, req);
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
