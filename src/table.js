var Table = function (protoTable) {
  Object.assign(this, protoTable);

  this.entries = function (callback) {
    for (var row of this.rows) {
      let entry = {};
      row.cells.forEach((cell, index) => entry[this.headers.cells[index]] = cell);
      callback(entry);
    }
  };
};

module.exports = Table;
