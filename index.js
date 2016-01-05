#! /usr/bin/env node

var fs = require('fs'),
    path = require('path');

var skeldir = path.join(__dirname, 'skel'),
    srcdir = path.join(process.env.GAUGE_PROJECT_ROOT, 'src'),
    testCode = 'step_implementation.js';

if(process.argv[2] === '--init') {

    console.log("Initialising Gauge JavaScript project");
    fs.mkdir(srcdir, 484, function(err) {
        if (err && err.code !== 'EEXIST') {
            console.error(err);
        } else {
            fs.createReadStream(path.join(skeldir, testCode))
                .pipe(fs.createWriteStream(path.join(srcdir, testCode)));
        }
    });
}

else if(process.argv[2] === '--start') {
    require('./src/gauge').run();
}
