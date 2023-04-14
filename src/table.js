var Table = function (protoTable) {
  Object.assign(this, protoTable);

  this.entries = function (callback) {
    for (var row of this.rows) {
      let entry = {};
      row.cells.forEach((cell, index) => entry[this.headers.cells[index]] = cell);
      callback(entry);
    }
  };

  this.asyncEntries = async function (callback) {
    for (let row of this.rows) {
      let entry = {};
      row.cells.forEach((cell, index) => entry[this.headers.cells[index]] = cell);
      await callback(entry);
    }
  };
};

module.exports = Table;
