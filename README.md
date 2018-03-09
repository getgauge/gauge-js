# Gauge-JS
JavaScript Runner for [Gauge](http://getgauge.io).

[![Build Status - Travis CI](https://travis-ci.org/getgauge/gauge-js.svg?branch=master)](https://travis-ci.org/getgauge/gauge-js)
[![Build status](https://ci.appveyor.com/api/projects/status/bpxrbrexfeeff6r6/branch/master?svg=true)](https://ci.appveyor.com/project/getgauge/gauge-js/branch/master)

Install through Gauge
---------------------
````
gauge install js
````

* Installing specific version
```
gauge install js --version 2.1.0
```

### Offline installation
* Download the plugin from [Releases](https://github.com/getgauge/gauge-js/releases)
```
gauge install js --file gauge-js-2.1.0.zip
```

### Nightly

To install js nightly, download the latest nightly from [here](https://bintray.com/gauge/gauge-js/Nightly).

Once you have the downloaded nightly gauge-js-version.nightly-yyyy-mm-dd.zip, install using:

    gauge install js -f gauge-js-version.nightly-yyyy-mm-dd.zip


### Documentation

For other details refer the documentation [here](https://getgauge.github.io/gauge-js)

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
