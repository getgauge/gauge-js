import { assert } from "chai";
import nodevm from "node:vm";
import sinon from "sinon";
import fs from "node:fs";
import VM from "../src/vm.js";
import path from "node:path";
import os from "node:os";
import hookRegistry from "../src/hook-registry.js";
import stepRegistry from "../src/step-registry.js";
import logger from "../src/logger.js";

describe("VM", function () {

  let sandbox;

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
    const vm = new VM();
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
      const vm = new VM();
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("var ohai = step"); });
    });

    it("__dirname", function () {
      const vm = new VM();
      vm.contextify(path.join(process.cwd(), "some", "file.js"));
      assert.doesNotThrow(function () {
        vm.run(`
          var path = require('path');
          var expected = path.join(process.cwd(), 'some');
          if (__dirname !== expected) {
            throw new Error('__dirname "' + __dirname + '" did not match "' + expected + '"');
          }
        `);
      });
    });

    it("__filename", function () {
      const vm = new VM();
      vm.contextify(path.join(process.cwd(), "some", "file.js"));
      assert.doesNotThrow(function () {
        vm.run(`
          var path = require('path');
          var expected = path.join(process.cwd(), 'some', 'file.js');
          if (__filename !== expected) {
            throw new Error('__filename "' + __filename + '" did not match "' + expected + '"');
          }
        `);
      });
    });

    it("require", function () {
      const vm = new VM();
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("var fs = require('fs')"); });
    });

    it("console", function () {
      const vm = new VM();
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("var log = console.log"); });
    });

    it("process.env", function () {
      const vm = new VM();
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("var GAUGE_PROJECT_ROOT = process.env.GAUGE_PROJECT_ROOT"); });
    });

    it("step", function () {
      const vm = new VM();
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("step('step', function(){})"); });
    });

    it("hooks", function () {
      const vm = new VM();
      vm.contextify();
      hookRegistry.types.forEach(function (type) {
        assert.doesNotThrow(function () { vm.run(type + "(function(){})"); });
      });
    });

    it("setImmediate", function () {
      const vm = new VM();
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("setImmediate(function () {})"); });
    });

    it("clearImmediate", function () {
      const vm = new VM();
      vm.contextify();
      assert.doesNotThrow(function () { vm.run("clearImmediate()"); });
    });
  });

  it("should not read from file and run code", function () {
    const vm = new VM();
    vm.contextify();
    assert.doesNotThrow(function () { vm.runFile("mytest_implementation.js"); });
    assert.equal(vm.options.filename, "mytest_implementation.js");
  });

});

describe("VM with ES modules", function () {
  let dir, cwd, projectRoot, fatal;

  before(function () {
    cwd = process.cwd();
    projectRoot = process.env.GAUGE_PROJECT_ROOT;
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "gauge-js-esm-"));
    process.env.GAUGE_PROJECT_ROOT = dir;
    fs.writeFileSync(path.join(dir, "step_implementation.mjs"), [
      "import assert from 'node:assert';",
      "export const vowels = 'aeiou';",
      "step('esm step', function () { assert.ok(vowels); });",
      "beforeScenario(function () {});"
    ].join("\n"));
    fs.writeFileSync(path.join(dir, "broken.mjs"), "export const n = 1;\nthrow new Error('boom');");
    fs.writeFileSync(path.join(dir, "detected.js"),
      "import assert from 'node:assert';\nstep('detected step', function () { assert.ok(true); });");
  });

  beforeEach(function () {
    fatal = sinon.stub(logger, "fatal");
    stepRegistry.clear();
  });

  afterEach(function () {
    fatal.restore();
  });

  after(function () {
    process.chdir(cwd);
    if (projectRoot === undefined) {
      delete process.env.GAUGE_PROJECT_ROOT;
    } else {
      process.env.GAUGE_PROJECT_ROOT = projectRoot;
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("should import the file and register its steps and hooks", async function () {
    const file = path.join(dir, "step_implementation.mjs");
    process.env.GAUGE_STEPFILEPATH = file;
    const vm = new VM();
    vm.contextify(file, dir);
    await vm.runFile(file);

    assert.isFalse(fatal.called, fatal.args.join("\n"));
    const step = stepRegistry.get("esm step");
    assert.isDefined(step);
    assert.isFunction(step.fn);
    assert.equal(step.fileLocations[0].filePath, file);
  });

  it("should import a .js file written as a module", async function () {
    const file = path.join(dir, "detected.js");
    process.env.GAUGE_STEPFILEPATH = file;
    const vm = new VM();
    vm.contextify(file, dir);
    await vm.runFile(file);

    assert.isFalse(fatal.called, fatal.args.join("\n"));
    assert.isFunction(stepRegistry.get("detected step").fn);
  });

  it("should report an error thrown while importing", async function () {
    const file = path.join(dir, "broken.mjs");
    const vm = new VM();
    vm.contextify(file, dir);
    await vm.runFile(file);

    assert.isTrue(fatal.calledOnce);
    assert.include(fatal.firstCall.args[0], "Error executing broken.mjs");
    assert.include(fatal.firstCall.args[0], "boom");
  });
});
