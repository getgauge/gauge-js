import { assert } from "chai";
import customMessageRegistry from "../src/custom-message-registry.js";

describe("Custom Message registry", function () {
  
  afterEach(function () {
    customMessageRegistry.clear();
  });

  it("Should return empty array after CustomMessageRegistry.clear", function () {
    customMessageRegistry.add("Hello");
    customMessageRegistry.add("World!");
    var list = customMessageRegistry.clear();

    assert.deepEqual(customMessageRegistry.get(), []);
    assert.deepEqual(list, []);
  });

  it("Should store and retrieve customMessages for valid customMessage types", function (done) {
    var list = [];

    for (var i=0; i<10; i++) {
      list.push("Hello " + i);
      customMessageRegistry.add("Hello " + i);
    }

    assert.deepEqual(list, customMessageRegistry.get());

    assert.notDeepEqual([], customMessageRegistry.get());

    done();
  });

});
