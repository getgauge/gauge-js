var assert = require("chai").assert;
var HookRegistry = require("../src/hook-registry");
var sinon  = require("sinon");

describe("Hook registry", function () {

  var hookRegistry;

  before(function () {
    hookRegistry = new HookRegistry();
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

    beforeEach(function () {
      hookRegistry.add("beforeSpec", function () {}, {});
      hookRegistry.add("beforeSpec", function () {}, {});
      hookRegistry.clear();
    });

    it("Should return empty object after HookRegistry.clear", function () {
      assert.deepEqual(hookRegistry.get(), {});
    });

    it("Should return empty array when no hooks have set for a hook name", function () {
      assert.deepEqual(hookRegistry.get("beforeSuite"), []);
    });

  });

  describe("Adding and removing", function () {
    var hookfn = function () { assert(1 + 1, 2); },
        hookopts = { tags: ["hello world"]};

    it("Should store and retrieve hooks for valid hook types", function (done) {
      var got;

      hookRegistry.types.forEach(function (hook) {
        hookRegistry.add(hook, hookfn, hookopts);
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
        list[hook].push({fn: hookfn, options: hookopts});
        hookRegistry.add(hook, hookfn, hookopts);
      });

      assert.deepEqual(hookRegistry.get(), list);
      done();

    });

    it("Should throw error when trying to add hook for invalid hook type", function () {
      var add = function () { hookRegistry.add("blah", hookfn, hookopts); };
      assert.throw(add);
    });

  });

});
