var Table = function (protoTable) {
  Object.assign(this, protoTable);

  this.entries = async function (callback) {
    for (const row of this.rows) {
      let entry = {};
      row.cells.forEach(
        (cell, index) => (entry[this.headers.cells[index]] = cell)
      );
      if (callback.constructor.name === "AsyncFunction") {
        await callback(entry);
      } else {
        callback(entry);
      }
    }
  };
};

module.exports = Table;
