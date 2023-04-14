## Issues

If you find any issues or have any feature requests, please file them in the [issue tracker](https://github.com/getgauge/gauge-js/issues).

If you are filing issues, please provide the version of `gauge` core and `gauge-js` plugin that you have installed. You can find it by doing:

```sh
$ gauge -v
```

## Develop

**Download**

```sh
$ git clone git://github.com/getgauge/gauge-js --recursive
```

**Setup**:

 - Preferably use [EditorConfig](http://editorconfig.org/) with your text editor.

**Install npm dependencies:**

```sh
$ npm install
```

**Run tests:**

```sh
$ npm test
```

### Create package

```sh
$ npm run package
```

### Installing from source

```sh
$ npm run installPlugin
```

### Code Style

- Indent: 2 spaces
- Line ending: LF


## Bump up gauge-js version

* Update the value `version` property in`js.json` file.

Ex:
```diff
     },
-    "version": "2.3.9",
+    "version": "2.3.10",
     "gaugeVersionSupport": {
```

* Update the value of `version` property in `package.json`.

Ex:
```diff
   "name": "gauge-js",
-  "version": "2.3.9",
+  "version": "2.3.10",
```