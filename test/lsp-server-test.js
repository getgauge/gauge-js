var path = require("path");
var protobuf = require("protobufjs");
var mock = require("mock-fs");
var assert = require("chai").assert;

var LspServerHandler = require("../src/lsp-server");
var registry = require("../src/step-registry");
var loader = require("../src/static-loader");

describe("LspServerHandler", function () {
  var options = null;
  before(function (done) {
    protobuf.load("gauge-proto/messages.proto").then(function (root) {
      options = {
        message: root.lookupType("gauge.messages.Message"),
        fileStatus: root.lookupEnum("gauge.messages.CacheFileRequest.FileStatus"),
        errorType: root.lookupEnum("gauge.messages.StepValidateResponse.ErrorType")
      };
      done();
    });
  });

  it(".getGlobPatterns should give the file glob patters", function (done) {
    process.env.GAUGE_PROJECT_ROOT = "";
    var handler = new LspServerHandler(null, options);
    handler.getGlobPatterns({ request: {} }, function (err, res) {
      assert.isNull(err);
      assert.ok(res.globPatterns.includes("tests/**/*.js"));
      done();
    });
  });

  it(".getImplementationFiles should get implementation files", function (done) {
    mock({
      "tests": {
        "example.js": "file content"
      },
    });
    process.env.GAUGE_PROJECT_ROOT = process.cwd();
    var handler = new LspServerHandler(null, options);
    handler.getImplementationFiles({ request: {} }, function (err, res) {
      assert.isNull(err);
      var files = res.implementationFilePaths;
      assert.equal(files.length, 1);
      assert.equal(path.basename(files[0]), "example.js");
      done();
    });
  });

  it(".getStepName should get step info", function (done) {
    registry.add("foo <bar>", null, "example.js", { start: 0, end: 0, statCahr: 0, endChar: 0 }, {});
    var handler = new LspServerHandler(null, options);
    handler.getStepName({ request: { stepValue: "foo {}" } }, function (err, res) {
      assert.isNull(err);
      assert.ok(res.isStepPresent);
      assert.ok(res.stepName.includes("foo <bar>"));
      done();
    });
  });

  it(".getStepNames should give all steps", function (done) {
    registry.add("foo <bar>", null, "example.js", { start: 0, end: 0, statCahr: 0, endChar: 0 }, {});
    registry.add("foo", null, "example.js", { start: 0, end: 0, statCahr: 0, endChar: 0 }, {});
    registry.add("bar", null, "example.js", { start: 0, end: 0, statCahr: 0, endChar: 0 }, {});
    var handler = new LspServerHandler(null, options);
    handler.getStepNames({ request: {} }, function (err, res) {
      assert.isNull(err);
      assert.ok(res.steps.length, 3);
      assert.ok(res.steps.includes("foo <bar>"));
      assert.ok(res.steps.includes("foo"));
      assert.ok(res.steps.includes("foo"));
      assert.notOk(res.steps.includes("jackperalta"));
      done();
    });
  });

  it(".getStepPositions should give all step positions in a given file", function () {
    registry.add("foo <bar>", null, "nothing.js", { start: 1, end: 2, statCahr: 0, endChar: 0 }, {});
    registry.add("foo", null, "example.js", { start: 1, end: 3, statCahr: 0, endChar: 0 }, {});
    registry.add("bar", null, "example.js", { start: 4, end: 6, statCahr: 0, endChar: 0 }, {});
    var handler = new LspServerHandler(null, options);
    process.env.GAUGE_PROJECT_ROOT = "";
    handler.getStepPositions({ request: { filePath: "nothing.js" } }, function (err, res) {
      assert.isNull(err);
      assert.ok(res.stepPositions.length, 1);
      assert.ok(res.stepPositions[0].stepValue, "foo {}");
    });

    handler.getStepPositions({ request: { filePath: "example.js" } }, function (err, res) {
      assert.isNull(err);
      assert.ok(res.stepPositions.length, 2);
    });
  });

  it(".implementStub should add stub in file when does not exists", function () {
    process.env.GAUGE_PROJECT_ROOT = process.cwd();
    var handler = new LspServerHandler(null, options);
    const req = { request: { implementationFilePath: "New File", codes: ["foo", "bar"] } };
    handler.implementStub(req, function (err, res) {
      assert.isNull(err);
      assert.equal(path.basename(res.filePath), "step_implementation.js");
      assert.equal(res.textDiffs[0].content, "foo\nbar");
    });
  });

  it(".implementStub should add stub in existing file", function () {
    mock({
      "tests": {
        "example.js": "something is here"
      }
    });
    process.env.GAUGE_PROJECT_ROOT = process.cwd();
    var handler = new LspServerHandler(null, options);
    const req = { request: { implementationFilePath: path.join(process.cwd(), "tests", "example.js"), codes: ["foo", "bar"] } };
    handler.implementStub(req, function (err, res) {
      assert.isNull(err);
      assert.equal(path.basename(res.filePath), "example.js");
      assert.equal(res.textDiffs[0].content, "\n\nfoo\nbar");
    });
  });

  it(".refactor should refactor step", function () {
    var content = "step('shhh',function(){\n\tconsole.log('hello')\n})";
    mock({ "tests": { "example.js": content } });
    loader.reloadFile(path.join(process.cwd(), "tests", "example.js"), content);

    var handler = new LspServerHandler(null, options);
    const req = {
      request: {
        saveChanges: false,
        newStepValue: {
          stepValue: "foo",
          parameterizedStepValue: "foo",
          parameters: []
        },
        oldStepValue: {
          stepValue: "shhh",
          parameterizedStepValue: "shhh",
          parameters: []
        },
        paramPositions: []
      }
    };
    handler.refactor(req, function (err, res) {
      assert.isNull(err);
      assert.ok(res.success);
    });
  });

  it(".validateStep should validate a step", function () {
    registry.add("foo", null, "example.js", { start: 1, end: 3, statCahr: 0, endChar: 0 }, {});
    var handler = new LspServerHandler(null, options);
    const req = {
      request: {
        stepText: "foo",
        stepValue: {
          stepValue: "foo",
          parameterizedText: "foo",
          parameters: []
        }
      }
    };
    handler.validateStep(req, function (err, res) {
      assert.isNull(err);
      assert.ok(res.isValid);
    });
  });

  it(".cacheFile should update registry with new steps", function () {
    process.env.GAUGE_PROJECT_ROOT = process.cwd();
    var filePath = path.join(process.cwd(), "tests", "example.js");
    var fileContent = "step('shhh',function(){\n\tconsole.log('hello')\n})";
    loader.reloadFile(filePath, fileContent);
    var handler = new LspServerHandler(null, options);

    const req = {
      request: {
        filePath: filePath,
        content: "step('foo',function(){\n\tconsole.log('hello')\n})",
        status: options.fileStatus.valuesById[options.fileStatus.values.CHANGED]
      }
    };
    handler.cacheFile(req, function (err) {
      assert.isNull(err);
      assert.isUndefined(registry.get("shhh"));
      assert.isDefined(registry.get("foo"));
    });
  });

  afterEach(function () {
    registry.clear();
    mock.restore();
  });
});
