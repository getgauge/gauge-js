# Gauge-JS

[![Actions Status](https://github.com/getgauge/gauge-js/workflows/build/badge.svg)](https://github.com/getgauge/gauge-js/actions)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v1.4%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)

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

Run the following command to create a [sample](https://github.com/getgauge/gauge-repository/tree/master/templates/js_webdriver) [WebDriver](http://webdriver.io/) template
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

##### Create offline package
```
npm run offlinePackage
```

## Copyright

Copyright 2018 ThoughtWorks, Inc.
