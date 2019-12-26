var assert = require("chai").assert,
  nodevm = require("vm"),
  sinon = require("sinon"),
  fs = require("fs"),
  VM = require("../src/vm"),
  path = require("path"),
  hookRegistry = require("../src/hook-registry");

describe("VM", function () {

  var sandbox;

  before( function () {
    sandbox = sinon.createSandbox();

    sandbox.stub( fs, "readFileSync").callsFake(function () {
      return "var x = 'oh, my!';";
    });
  });

  after( function () {
    sandbox.restore();
  });

  it("should instantiate with sane defaults", function (done) {
    sinon.spy(nodevm, "createContext");
    var vm = new VM();
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
      var vm = new VM();
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("var ohai = gauge.step"); });
    });

    it("__dirname", function () {
      var vm = new VM();
      vm.contextify(path.join("/", "some", "file.js"));
      assert.doesNotThrow(function () {
        vm.run(`
          var path = require('path');
          var expected = path.join('/', 'some');
          if (__dirname !== expected) {
            throw new Error('__dirname "' + __dirname + '" did not match "' + expected + '"');
          }
        `);
      });
    });

    it("__filename", function () {
      var vm = new VM();
      vm.contextify(path.join("/", "some", "file.js"));
      assert.doesNotThrow(function () {
        vm.run(`
          var path = require('path');
          var expected = path.join('/', 'some', 'file.js');
          if (__filename !== expected) {
            throw new Error('__filename "' + __filename + '" did not match "' + expected + '"');
          }
        `);
      });
    });

    it("require", function () {
      var vm = new VM();
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("var fs = require('fs')"); });
    });

    it("console", function () {
      var vm = new VM();
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("var log = console.log"); });
    });

    it("process.env", function () {
      var vm = new VM();
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("var GAUGE_PROJECT_ROOT = process.env.GAUGE_PROJECT_ROOT"); });
    });

    it("step", function () {
      var vm = new VM();
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("step('step', function(){})"); });
    });

    it("hooks", function () {
      var vm = new VM();
      vm.contextify();
      hookRegistry.types.forEach(function (type) {
        assert.doesNotThrow(function () { vm.run(type + "(function(){})"); });
      });
    });

    it("setImmediate", function () {
      var vm = new VM();
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("setImmediate(function () {})"); });
    });

    it("clearImmediate", function () {
      var vm = new VM();
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("clearImmediate()"); });
    });
  });

  it("should not read from file and run code", function () {
    var vm = new VM();
    vm.contextify();
    assert.doesNotThrow(function () { vm.runFile("mytest_implementation.js"); });
    assert.equal(vm.options.filename, "mytest_implementation.js");
  });

});
