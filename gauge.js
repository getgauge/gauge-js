#! /usr/bin/env node

var connection = require('./connection');

console.log("JavaScript is awesome!!");

if(process.argv[2] === '--init') {
    console.log('Initializing project.');
}
else if(process.argv[2] === '--start') {
    console.log('Running specs');
    new connection('localhost', process.env.GAUGE_INTERNAL_PORT).run();
}