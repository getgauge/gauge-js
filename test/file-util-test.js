var assert = require("chai").assert;
var fileUtil = require("../src/file-util");
var isWindows = require("check-if-windows");
var mock = require("mock-fs");

describe("File util functions", function () {
  describe("isSameFilePath", function () {
    it("Should return true when given paths are same windows", function () {
      if (!isWindows) {
        this.skip();
      } else {
        var path1 = "c:/Users/user_name/test_js/tests/step_implementation.js";
        var path2 = "C:/Users/user_name/test_js/tests/step_implementation.js";

        assert.isTrue(fileUtil.isSameFilePath(path1, path2));
      }
    });

    it("Should return true when given paths are with different fileseperator ", function () {
      if (!isWindows) {
        this.skip();
      } else {
        var path1 = "c:\\Users\\user_name\\test_js\\tests\\step_implementation.js";
        var path2 = "c:/Users/user_name/test_js/tests/step_implementation.js";

        assert.isTrue(fileUtil.isSameFilePath(path1, path2));
      }
    });

    it("Should return true when given paths are same and has space ", function () {
      var path1 = "/Users/test_js/tests/Step implementation.js";
      var path2 = "/Users/test_js/tests/Step implementation.js";

      assert.isTrue(fileUtil.isSameFilePath(path1, path2));
    });


    it("Should return true when given paths are same on linux ", function () {
      var path1 = "/Users/test_js/tests/Step_implementation.js";
      var path2 = "/Users/test_js/tests/Step_implementation.js";

      assert.isTrue(fileUtil.isSameFilePath(path1, path2));
    });

    it("Should return false when given paths are not different", function () {
      var path1 = "/Users/test_js/tests/Step_implementation.js";
      var path2 = "/Users/test_js/tests1/step_implementation.js";

      assert.isFalse(fileUtil.isSameFilePath(path1, path2));
    });
  });

  describe("getListOfFiles", function () {
    afterEach(function () {
      mock.restore();
    });

    it("should get all the js file", function () {
      mock({
        "tests": {
          "step-impl.js": "file content",
          "inner-dir": {
            "foo.js": "foo"
          },
        },
      });
      var files = fileUtil.getListOfFiles(process.cwd());
      assert.equal(files.length, 2);
    });

    it("should get only js file", function () {
      mock({
        "tests": {
          "step-impl.js": "file content",
          "inner-dir": {
            "foo.js": "foo",
            "foo.txt": "foo"
          },
        }
      });
      var files = fileUtil.getListOfFiles(process.cwd());
      assert.equal(files.length, 2);
    });

    it("should get scan only tests dir by default", function () {
      mock({
        "some-other": {
          "step-impl.js": "file content",
          "inner-dir": {
            "foo.js": "foo",
            "foo.txt": "foo"
          },
        }
      });
      var files = fileUtil.getListOfFiles(process.cwd());
      assert.equal(files.length, 0);
    });

    it("should get scan only dir specified as STEP_IMPL_DIR env", function () {
      mock({
        "custom": {
          "step-impl.js": "file content",
          "inner-dir": {
            "foo.js": "foo",
            "foo.txt": "foo"
          },
        },
        "tests": {
          "step-impl.js": "file content",
          "inner-dir": {
            "foo.js": "foo",
            "foo.txt": "foo"
          },
        }
      });
      process.env.STEP_IMP_DIR = "custom";
      var files = fileUtil.getListOfFiles(process.cwd());
      assert.equal(files.length, 2);
    });
  });
});
