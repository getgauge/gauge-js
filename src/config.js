var defaultConfig = {
  testMatch: ["**/tests/**/*.js"]
};

function getInstance() {
  var configObject;
  console.log(process.env.test_match);

  if(process.env.test_match !== undefined){

    configObject = {
      testMatch: process.env.test_match.split(",").map(function(item) {
        return item.replace(/^[\s\'\"]+|[\s\'\"]+$/g, "");
      })
    };
  }
  else{
    configObject = defaultConfig;
  }
  console.log(configObject);
  return configObject;
}

module.exports = {
  
  getInstance: getInstance
};
