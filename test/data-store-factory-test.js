var assert = require("chai").assert;
var dataStoreFactory = require("../src/data-store-factory");

describe("DataStoreFactory", function () {
  describe("get data from datastore", function () {
    it("should return the data as user set in suite datastore", function () {
      dataStoreFactory.suiteStore.put("text", "message");
      let data = dataStoreFactory.suiteStore.get("text");
      assert.equal(data, "message");
    });

    it("should return the data as user set in spec datastore", function () {
      dataStoreFactory.specStore.put("text", "message");
      let data = dataStoreFactory.specStore.get("text");
      assert.equal(data, "message");
    });

    it("should return the data as user set in scenario datastore", function () {
      dataStoreFactory.scenarioStore.put("text", "message");
      let data = dataStoreFactory.scenarioStore.get("text");
      assert.equal(data, "message");
    });

    it("should return null if no value is set in datastore", function () {
      dataStoreFactory.scenarioStore.put("text");
      let data = dataStoreFactory.scenarioStore.get("text");
      assert.equal(data, null);
    });

    it("should return the same for falsy values", function () {
      dataStoreFactory.scenarioStore.put("text", false);
      let data = dataStoreFactory.scenarioStore.get("text");
      assert.equal(data, false);
      dataStoreFactory.scenarioStore.put("text", 0);
      data = dataStoreFactory.scenarioStore.get("text");
      assert.equal(data, 0);
    });
  });
});