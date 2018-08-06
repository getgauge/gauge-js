# Gauge-JS

[![Build Status - Travis CI](https://travis-ci.org/getgauge/gauge-js.svg?branch=master)](https://travis-ci.org/getgauge/gauge-js)
[![Build status](https://ci.appveyor.com/api/projects/status/bpxrbrexfeeff6r6/branch/master?svg=true)](https://ci.appveyor.com/project/getgauge/gauge-js/branch/master)

This project adds Javascript [language plugin](https://docs.gauge.org/plugins.html#language-reporting-plugins) for [gauge](http://getgauge.io).

## Getting started

### Pre-requisite

- [Gauge](https://gauge.org/index.html)

### Installation
```
gauge install js
```

### Create a gauge-js project
```
gauge init js
```

### Run tests
```
gauge run specs
```

## Documentation

For other details refer the documentation [here](https://docs.gauge.org)

## Demos and examples

### Plain Javascript

Run the following command to create a [sample](https://github.com/getgauge/gauge-repository/tree/master/templates/js) gauge template

```
$ gauge init js
```

### Puppeteer

Run the following command to create a [sample](https://github.com/getgauge/gauge-repository/tree/master/templates/js_puppeteer) [Puppeteer](https://github.com/GoogleChrome/puppeteer) template 

```
$ gauge init js_puppeteer
```

### WebDriver

Run the following command to create a [sample](https://github.com/getgauge/gauge-repository/tree/master/templates/js_webdriver) [WebDriver](https://webdriver.io) template
```
$ gauge init js_webdriver
```

### Alternate Installation options

#### Install specific version
```
gauge install js --version 2.1.0
```

### Offline installation
* Download the plugin from [Releases](https://github.com/getgauge/gauge-js/releases)
```
gauge install js --file gauge-js-2.1.0.zip
```

#### Nightly installation
To install js nightly, download the latest nightly from [here](https://bintray.com/gauge/gauge-js/Nightly).

Once you have the downloaded nightly gauge-js-version.nightly-yyyy-mm-dd.zip, install using:

    gauge install js -f gauge-js-version.nightly-yyyy-mm-dd.zip


#### Build from Source
The plugin is authored in [Javascript](https://en.wikipedia.org/wiki/JavaScript).
Gauge is authored in golang. These are independent processes talking to each other over TCP on port GAUGE_INTERNAL_PORT (env variable) using [Protobuf](https://github.com/getgauge/gauge-proto).

##### Pre-Requisites
* [Node.js](https://nodejs.org/en/) - Version > 8
* [Npm](https://www.npmjs.com/get-npm)

##### Compiling
```
npm install
```

##### Run tests:
```
npm test
```

##### Installing from source
```
npm run installPlugin
```

##### Create package
```
npm run package
```

## Copyright

Copyright 2018 ThoughtWorks, Inc.
