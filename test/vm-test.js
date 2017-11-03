var assert = require("chai").assert,
    nodevm = require("vm"),
    sinon = require("sinon"),
    fs = require("fs"),
    vm = require("../src/vm"),
    path = require("path"),
    hookRegistry = require("../src/hook-registry");

describe("VM", function () {
  var sandbox;
  before( function () {
    sandbox = sinon.sandbox.create();
    sandbox.stub( fs, "readFileSync").callsFake(function () {
      return "var x = 'oh, my!';";
    });
  });

  beforeEach(function(){
    vm.reinit();
  });

  after( function () {
    sandbox.restore();
  });

  it("should instantiate with sane defaults", function (done) {
    sinon.spy(nodevm, "createContext");
    vm.contextify();

    assert(nodevm.createContext.calledOnce);
    assert.isDefined(vm.context);
    assert.deepEqual(vm.options, {
      dirname: ".",
      filename: "test.js",
      filepath: path.join(".", "test.js"),
      displayErrors: true,
      timeout: 1000,
      root: process.cwd()
    });

    nodevm.createContext.restore();
    done();
  });

  describe("should expose", function() {
    it("global.gauge", function () {
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("var ohai = gauge.step"); });
    });

    it("require", function () {
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("var fs = require('fs')"); });
    });

    it("console", function () {
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("var log = console.log"); });
    });

    it("process.env", function () {
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("var GAUGE_PROJECT_ROOT = process.env.GAUGE_PROJECT_ROOT"); });
    });

    it("step", function () {
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("step('step', function(){})"); });
    });

    it("hooks", function () {
      vm.contextify();
      hookRegistry.types.forEach(function (type) {
        assert.doesNotThrow(function () { vm.run(type + "(function(){})"); });
      });
    });
  });

  it("should not read from file and run code", function () {
    vm.contextify();
    assert.doesNotThrow(function () { vm.runFile("mytest_implementation.js"); });
    assert.equal(vm.options.filename, "mytest_implementation.js");
  });

});
