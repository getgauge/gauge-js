var assert = require("chai").assert;
var hookRegistry = require("../src/hook-registry");
var sinon  = require("sinon");

var implFile = "implementation.js";

describe("Hook registry", function () {

  before(function () {
    sinon.spy(hookRegistry, "get");
  });

  afterEach(function () {
    hookRegistry.clear();
  });

  after(function () {
    hookRegistry.get.restore();
  });

  it("Should have pre-defined hook types", function () {

    assert.deepEqual(hookRegistry.types, [
      "beforeSuite",
      "afterSuite",
      "beforeSpec",
      "afterSpec",
      "beforeScenario",
      "afterScenario",
      "beforeStep",
      "afterStep"
    ]);
  });

  describe("Clear", function () {
    var secondImplFile = "new_impl.js";
    var hookFn = function () {};
    beforeEach(function () {
      hookRegistry.add("beforeSpec", hookFn, {}, implFile);
      hookRegistry.add("beforeSpec", hookFn, {},  secondImplFile);
      hookRegistry.add("afterSpec", hookFn, {}, implFile);
      hookRegistry.add("afterSpec", hookFn, {},  secondImplFile);
    });

    it("Should return empty object after HookRegistry.clear", function () {
      hookRegistry.clear();
      assert.deepEqual(hookRegistry.get(), {});
    });

    it("Should return empty array when no hooks have set for a hook name", function () {
      hookRegistry.clear();
      assert.deepEqual(hookRegistry.get("beforeSuite"), []);
    });

    it("Should clear all hooks for given file after HookRegistry.clearFile", function () {
      hookRegistry.clearFile(implFile);
      assert.deepEqual(hookRegistry.get("beforeSpec"), [{"fn": hookFn, "options": {}, "filePath": secondImplFile}]);
      assert.deepEqual(hookRegistry.get("afterSpec"), [{"fn": hookFn, "options": {}, "filePath": secondImplFile}]);
    });

  });

  describe("Adding and removing", function () {
    var hookfn = function () { assert(1 + 1, 2); },
        hookopts = { tags: ["hello world"]};

    it("Should store and retrieve hooks for valid hook types", function (done) {
      var got;

      hookRegistry.types.forEach(function (hook) {
        hookRegistry.add(hook, hookfn, hookopts,implFile);
        got = hookRegistry.get(hook);

        assert.equal(hookfn, got[0].fn);
        assert.deepEqual(hookopts, got[0].options);
      });

      done();
    });

    it("Should retrieve all hooks when calling HookRegistry.get without arguments", function (done) {
      var list = {};

      hookRegistry.types.forEach(function (hook) {
        list[hook] = list[hook] || [];
        list[hook].push({fn: hookfn, options: hookopts, filePath: implFile});
        hookRegistry.add(hook, hookfn, hookopts, implFile);
      });

      assert.deepEqual(hookRegistry.get(), list);
      done();

    });

    it("Should throw error when trying to add hook for invalid hook type", function () {
      var add = function () { hookRegistry.add("blah", hookfn, hookopts, implFile); };
      assert.throw(add);
    });

  });

});
