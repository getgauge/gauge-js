var Table = require("../src/table");
var expect = require("chai").expect;
const util = require("util");
const setTimeoutPromise = util.promisify(setTimeout);

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

  let getRowData = function(entry) {
    const rowData = setTimeoutPromise(500, entry).then((value) => {
      return {cells: [value["Product"], value["Description"]]};
    });
    return rowData;

  };

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

    it("Should process an asynchronous callback action", async function () {
      let data = [];

      await table.entries(async (entry) => data.push(await getRowData(entry)));

      expect(data).to.deep.equal(protoTable.rows);
    }).timeout(10000);

  });

});
