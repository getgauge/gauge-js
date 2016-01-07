var assert = require("chai").assert;
var stepParser = require("../src/step-parser");

describe("Parsing steps", function() {

  it("Should generalise a step.", function(done) {
    assert.equal("Say {} to {}", stepParser.generalise("Say <greeting> to <user>"));
    assert.equal("A step without any paramaeters", stepParser.generalise("A step without any paramaeters"));
    done();
  });

  it("Should parse the parameters.", function(done) {
    assert.deepEqual(["greeting", "user"], stepParser.getParams("Say <greeting> to <user>"));
    assert.deepEqual([], stepParser.getParams("A step without any parameters"));
    done();
  });

});
