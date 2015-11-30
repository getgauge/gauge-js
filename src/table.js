/**
{
  headers: {
    cells: [ 'Product', 'Description' ]
  },
  rows: [
    { cells: [ 'Gauge', 'Test automation with ease' ] },
    { cells: [ 'Mingle', 'Agile project management' ] },
    { cells: [ 'Snap', 'Hosted continuous integration' ] },
    { cells: [ 'Gocd', 'Continuous delivery platform' ] }
  ]
}
*/

var Table = function(protoTable) {
  this.protoTable = protoTable;

  this.headers = protoTable.headers.cells.map(function(header) {
    return header;
  });

  this.rows = protoTable.rows.map(function(row) {
    return row.cells;
  });
};

module.exports = Table;
