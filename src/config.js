var path = require("path");

function getInstance(projectRoot) {
  var configObject;
  if(process.env.test_match !== undefined){
    configObject = {
      testMatch: process.env.test_match.split(",").map(function(item) {
        return item.replace(/^[\s\'\"]+|[\s\'\"]+$/g, "");
      })
    };
  }
  else{
    configObject = {
      testMatch: [path.join(projectRoot, "tests", "**","*.js")]
    };
  }
  return configObject;
}

module.exports = {
  getInstance: getInstance
};
