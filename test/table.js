var Table = require("../src/table");
var expect = require("chai").expect;

describe("ProtoTable parsing", function() {

  var protoTable = {
    headers: {
      cells: [ "Product", "Description" ]
    },
    rows: [
      { cells: [ "Gauge", "Test automation with ease" ] },
      { cells: [ "Mingle", "Agile project management" ] },
      { cells: [ "Snap", "Hosted continuous integration" ] },
      { cells: [ "Gocd", "Continuous delivery platform" ] }
    ]
  };

  var table = new Table(protoTable);

  it("Should get headers", function () {
    expect(table.headers).to.deep.equal(protoTable.headers);
  });

  it("Should get rows", function () {
    expect(table.rows).to.deep.equal(protoTable.rows);
  });

  describe("Table entries", function () {

    it("Should have correct number of entries", function () {
      var result = [];
      table.entries(entry => result.push(entry));
      expect(result.length).to.equal(4);
    });

    it("Should have correct entry object", function () {
      var result = [];
      table.entries(entry => result.push(entry));
      expect(result[1]).to.deep.equal({
        "Product": "Mingle",
        "Description": "Agile project management"
      });
    });
  });

});
