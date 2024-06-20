import path from "node:path";
import { fileURLToPath } from "node:url";
import { assert } from "chai";
import isWindows from "check-if-windows";
import mock from "mock-tmp";
import fileUtil from "../src/file-util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("File util functions", () => {
  describe("isSameFilePath", () => {
    it("Should return true when given paths are same windows", function() {
      if (!isWindows) {
        this.skip();
      } else {
        const path1 = "c:/Users/user_name/test_js/tests/step_implementation.js";
        const path2 = "C:/Users/user_name/test_js/tests/step_implementation.js";

        assert.isTrue(fileUtil.isSameFilePath(path1, path2));
      }
    });

    it("Should return true when given paths are with different fileseperator ", function() {
      if (!isWindows) {
        this.skip();
      } else {
        const path1 =
          "c:\\Users\\user_name\\test_js\\tests\\step_implementation.js";
        const path2 = "c:/Users/user_name/test_js/tests/step_implementation.js";

        assert.isTrue(fileUtil.isSameFilePath(path1, path2));
      }
    });

    it("Should return true when given paths are same and has space ", () => {
      const path1 = "/Users/test_js/tests/Step implementation.js";
      const path2 = "/Users/test_js/tests/Step implementation.js";

      assert.isTrue(fileUtil.isSameFilePath(path1, path2));
    });

    it("Should return true when given paths are same on linux ", () => {
      const path1 = "/Users/test_js/tests/Step_implementation.js";
      const path2 = "/Users/test_js/tests/Step_implementation.js";

      assert.isTrue(fileUtil.isSameFilePath(path1, path2));
    });

    it("Should return false when given paths are not different", () => {
      const path1 = "/Users/test_js/tests/Step_implementation.js";
      const path2 = "/Users/test_js/tests1/step_implementation.js";

      assert.isFalse(fileUtil.isSameFilePath(path1, path2));
    });
  });

  describe("getListOfFiles", () => {
    it("should get all the js file", () => {
      process.env.GAUGE_PROJECT_ROOT = path.join(__dirname, "testdata");
      const files = fileUtil.getListOfFiles();
      assert.equal(files.length, 2);
    });

    it("should get only js file", () => {
      process.env.GAUGE_PROJECT_ROOT = path.join(__dirname, "testdata");
      const files = fileUtil.getListOfFiles();
      assert.equal(files.length, 2);
    });

    it("should get scan only tests dir by default", () => {
      process.env.GAUGE_PROJECT_ROOT = path.join(
        __dirname,
        "testdata",
        "custom",
      );
      const files = fileUtil.getListOfFiles();
      assert.equal(files.length, 0);
    });

    it("should get scan only dir specified as STEP_IMPL_DIR env", () => {
      process.env.STEP_IMP_DIR = "custom";
      process.env.GAUGE_PROJECT_ROOT = path.join(__dirname, "testdata");
      const files = fileUtil.getListOfFiles();
      assert.equal(files.length, 2);
    });
  });

  describe("getFileName", () => {
    afterEach(() => {
      mock.reset();
    });

    it("should give default file name does not exist", () => {
      const tmp = mock({
        tests: {},
      });

      const file = fileUtil.getFileName(path.join(tmp, "tests"));
      assert.equal(path.basename(file), "step_implementation.js");
    });

    it("should give file name with increment if default exists", () => {
      let tmp = mock({
        tests: {
          "step_implementation.js": "foo",
        },
      });

      let file = fileUtil.getFileName(path.join(tmp, "tests"));
      assert.equal(path.basename(file), "step_implementation_1.js");

      mock.reset();

      tmp = mock({
        tests: {
          "step_implementation.js": "foo",
          "step_implementation_1.js": "something",
        },
      });

      file = fileUtil.getFileName(path.join(tmp, "tests"));
      assert.equal(path.basename(file), "step_implementation_2.js");
    });
  });

  describe("isInImplDir", () => {
    afterEach(() => {
      process.env.GAUGE_PROJECT_ROOT = process.cwd();
      mock.reset();
    });

    it("should be true if file is under implementation dir", () => {
      const tmp = mock({
        tests: {
          "step_impl.js": "file content",
        },
      });
      process.env.GAUGE_PROJECT_ROOT = tmp;
      assert.isTrue(
        fileUtil.isInImplDir(path.join(tmp, "tests", "step_impl.js")),
      );
    });

    it("should be true if file in nested dir under implementation dir", () => {
      const tmp = mock({
        tests: {
          "inner-dir": {
            "step_impl.js": "file content",
          },
        },
      });
      process.env.GAUGE_PROJECT_ROOT = tmp;
      assert.isTrue(
        fileUtil.isInImplDir(
          path.join(tmp, "tests", "inner-dir", "step_impl.js"),
        ),
      );
    });

    it("should be false if file is not under implementation dir", () => {
      const tmp = mock({
        tests: {
          "inner-dir": {
            "step_impl.js": "file content",
          },
        },
      });
      process.env.GAUGE_PROJECT_ROOT = tmp;
      assert.isFalse(fileUtil.isInImplDir(path.join(tmp, "step_impl.js")));
    });
  });

  describe("isJSFile", () => {
    it("should check for js file extensions", () => {
      assert.isTrue(fileUtil.isJSFile("step_impl.js"));
      assert.isFalse(fileUtil.isJSFile("step_impl.java"));
    });
  });
});
