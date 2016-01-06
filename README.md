[![Build Status](https://snap-ci.com/renjithgr/gauge-js/branch/master/build_image)](https://snap-ci.com/renjithgr/gauge-js/branch/master)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/78f5eca45e38482a910309c7f2757f60)](https://www.codacy.com/app/grenjithr/gauge-js)
# Gauge-JS
JavaScript Runner for [Gauge](http://www.getgauge.io).

### Installation Instructions
Clone Gauge-JS plugin repo:
```sh
$ git clone git@github.com:renjithgr/gauge-js.git
```

Initialize gauge-proto submodule:
```sh
$ git submodule init
```

Fetch gauge-proto submodule:
```sh
$ git submodule update
```

Install npm dependencies:
```sh
$ npm install
```

Run tests:
```sh
$ npm run check-style
$ npm run lint
$ npm test
```

Copy all contents of the gauge-js dir to the following directories:
- Windows: %APPDATA%\.gauge\plugins\js\0.0.1\
- MacOS: ~/.gauge/plugins/js/0.0.1/
- Linux: ~/.gauge/plugins/js/0.0.1/

To initialize a project with gauge-js, in an empty directory run:
```sh
gauge --init js
```

Run specs
```sh
gauge specs/
```

## License

![GNU Public License version 3.0](http://www.gnu.org/graphics/gplv3-127x51.png)
Gauge-JS is released under [GNU Public License version 3.0](http://www.gnu.org/licenses/gpl-3.0.txt)
