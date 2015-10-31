#! /usr/bin/env node

console.log("JavaScript is awesome!!");

if(process.argv[2] === '--init') {
  console.log('Initializing project.');
}
else if(process.argv[2] === '--start') {
  console.log('Running specs');
  require('./gauge').run();
}
