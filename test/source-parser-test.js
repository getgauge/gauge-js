import { assert } from "chai";
import sourceParser from "../src/source-parser.js";

describe("Source parser", function () {
  it("should parse a script with locations", function () {
    const { ast, sourceType } = sourceParser.parse("step('a', function () {});", { loc: true });
    assert.equal(sourceType, "script");
    assert.equal(ast.body[0].loc.start.line, 1);
  });

  it("should parse an ES module", function () {
    const source = "import assert from 'node:assert';\nexport const n = 1;\nstep('a', function () {});";
    const { ast, sourceType } = sourceParser.parse(source);
    assert.equal(sourceType, "module");
    assert.equal(ast.body[0].type, "ImportDeclaration");
    assert.equal(ast.body[2].type, "ExpressionStatement");
  });

  it("should report the error for the kind of file it was given", function () {
    assert.throws(() => sourceParser.parse("step('a', function ( {});"), /Line 1/);
    assert.throws(() => sourceParser.parse("import x from 'y';\nstep('a', function ( {});"), /Line 2/);
  });

  it("should tell modules from scripts, even when they do not parse", function () {
    assert.isTrue(sourceParser.isModule("export const n = 1;"));
    assert.isFalse(sourceParser.isModule("var n = 1;"));
    assert.isFalse(sourceParser.isModule("var n = 1; this is not javascript"));
    assert.isTrue(sourceParser.isModule("import x from 'y';\nthis is not javascript"));
  });
});
