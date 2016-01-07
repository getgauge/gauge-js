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

  it("Should get headers", function() {
    var table = new Table(protoTable);
    expect(table.headers).to.deep.equal(["Product", "Description"]);
  });

  it("Should get rows", function() {
    var table = new Table(protoTable);
    expect(table.rows[0]).to.deep.equal(["Gauge", "Test automation with ease"]);
  });

});
