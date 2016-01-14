# Gauge-JS
JavaScript Runner for [Gauge](http://www.getgauge.io).

## Installation Instructions

**Clone Gauge-JS plugin repo:**

```sh
$ git clone git@github.com:renjithgr/gauge-js.git --recursive
```

**Install plugin:**

```sh
$ cd gauge-js
$ npm install
$ npm run installPlugin
```

**Initialize:** To initialize a project with gauge-js, in an empty directory run:

```sh
gauge --init js
```

**Run specs:**

```sh
gauge specs/
```

## Develop

**Setup**:

 - Preferably use [EditorConfig](http://editorconfig.org/) with your text editor.

**Install npm dependencies:**

```sh
$ npm install
```

**Run tests:**

```sh
$ npm run check-style
$ npm run lint
$ npm test
```

### Code Style

- Indent: 2 spaces
- Line ending: LF

## License

![GNU Public License version 3.0](http://www.gnu.org/graphics/gplv3-127x51.png)
Gauge-JS is released under [GNU Public License version 3.0](http://www.gnu.org/licenses/gpl-3.0.txt)
