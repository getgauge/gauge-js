#! /usr/bin/env node
var fs = require('fs');
console.log("JavaScript is awesome!!");
var GAUGE_PROJECT_ROOT = process.env.GAUGE_PROJECT_ROOT;

if(process.argv[2] === '--init') {
  console.log('Initializing project.');
  fs.mkdir(GAUGE_PROJECT_ROOT + '/step_implementations', 484, function(err) {
    if (err) {
      if (err.code == 'EEXIST') {

      } // ignore the error if the folder already exists
      else console.error(err); // something else went wrong
    }
    else {
      fs.createReadStream(__dirname + '/step_implementations/sample.js')
        .pipe(fs.createWriteStream(GAUGE_PROJECT_ROOT + '/step_implementations/sample.js'));
    }
  });
}
else if(process.argv[2] === '--start') {
  console.log('Running specs');
  require('./gauge').run();
}
