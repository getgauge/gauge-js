# Gauge-JS
JavaScript Runner for [Gauge](http://www.getgauge.io).

[![Build Status](https://snap-ci.com/getgauge-contrib/gauge-js/branch/master/build_image)](https://snap-ci.com/getgauge-contrib/gauge-js/branch/master)

## Install
- Before installing gauge-js, make sure Gauge `v0.3.0` or above is installed.

    ```sh
    gauge -v
    ```
    
### Installing from zip file
- Download `gauge-js-<version>.zip` from the [releases](https://github.com/getgauge-contrib/gauge-js/releases) page.
- Install plugin from downloaded file:

    ```sh
    $ gauge --install js --file <path-to-zip-file>/gauge-js-<version>.zip`
    ```

### Installing from source

- Clone Gauge-JS plugin repo.

    ```sh
    $ git clone git@github.com:getgauge-contrib/gauge-js.git --recursive
    ```

- Install plugin.

    ```sh
    $ cd gauge-js
    $ npm install
    $ npm run installPlugin
    ```

## Usage

If you are new to Gauge, please consult the [Gauge documentation](http://getgauge.io/documentation/user/current/) to know about how Gauge works.

**Initialize:** To initialize a project with gauge-js, in an empty directory run:

```sh
gauge --init js
```

**Run specs:**

```sh
gauge specs/
```

## Methods

### Step implementation

**`gauge (<step-text>, fn)`**

Use the `gauge()` method to implement your steps. For example:

```js
gauge("Vowels in English language are <vowels>.", function(vowelsGiven) {
  assert.equal(vowelsGiven, "aeiou");
});
```

### Execution Hooks

gauge-js supports tagged [execution hooks](http://getgauge.io/documentation/user/current/execution/execution_hooks.html). These methods are available for each type of hook:

"Before" hooks:

- **`beforeSuite (fn, [opts])`** - Executed before the test suite begins
- **`beforeSpec  (fn, [opts])`** - Executed before each specification
- **`beforeScenario (fn, [opts])`** - Executed before each scenario
- **`beforeStep (fn, [opts])`**- Execute before each step

"After" hooks:

- **`afterSuite (fn, [opts])`** - Executed after the test suite begins
- **`afterSpec  (fn, [opts])`** - Executed after each specification
- **`afterScenario (fn, [opts])`** - Executed after each scenario
- **`afterStep (fn, [opts])`**- Execute after each step

Here's an example of a hook that is executed before each scenario:

```js
beforeScenario (function () {
    assert.equal(vowels.join(""), "aeiou");
});
```

**`opts`**:

Each hook takes an optional 2nd argument as an object. It can contain the following properties:

- *`tags`*: Default: `[]`.
An array of strings for the tags for which to execute the current callback. These are only useful at specification or scenario level. If not specified, the provided callback is executed on each occurrence of the hook.
- *`operator`*: Valid values: `"AND"`, `"OR"`. Default: `"AND"`.
This controls whether the current callback is executed when all of the tags match (in case of `"AND"`), or if any of the tags match (in case of `OR`).

Example of a tagged execution hook implementation:

```js
beforeScenario (function () {
  assert.equal(vowels[0], "a");
}, { tags: [ "single word" ]});
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

### Create package

```sh
$ npm run package
```

### Code Style

- Indent: 2 spaces
- Line ending: LF

## License

![GNU Public License version 3.0](http://www.gnu.org/graphics/gplv3-127x51.png)
Gauge-JS is released under [GNU Public License version 3.0](http://www.gnu.org/licenses/gpl-3.0.txt)
