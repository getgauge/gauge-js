# Gauge-JS
JavaScript Runner for [Gauge](http://www.getgauge.io).

[![Build Status](https://snap-ci.com/getgauge-contrib/gauge-js/branch/master/build_image)](https://snap-ci.com/getgauge-contrib/gauge-js/branch/master)

## Install
- Before installing gauge-js, make sure Gauge `v0.3.0` or above is installed.

    ```sh
    $ gauge -v
    ```

### Install through gauge (Recommended)

```sh
$ gauge --install js
```

### Installing from zip file
- Download `gauge-js-<version>.zip` from the [releases](https://github.com/getgauge-contrib/gauge-js/releases/latest) page.
- Install plugin from downloaded file:

    ```sh
    $ gauge --install js --file <path-to-zip-file>/gauge-js-<version>.zip`
    ```

## Usage

If you are new to Gauge, please consult the [Gauge documentation](http://getgauge.io/documentation/user/current/) to know about how Gauge works.

**Initialize:** To initialize a project with gauge-js, in an empty directory run:

```sh
$ gauge --init js
```

**Run specs:**

```sh
$ gauge specs/
```

## Methods

### Step implementation

**`gauge.step (<step-text>, fn)`**

Use the `gauge.step()` method to implement your steps. For example:

```js
gauge.step("Vowels in English language are <vowels>.", function(vowelsGiven) {
  assert.equal(vowelsGiven, "aeiou");
});
```

#### Multiple step names

To implement the same function for multiple step names (aka, step aliases), pass an `array` of `strings` as the first argument to `gauge.step()`. For example:

```js
gauge.step(["Create a user <username>", "Create another user <username>"], function (username) {
  // do cool stuff
});
```

### Execution Hooks

gauge-js supports tagged [execution hooks](http://getgauge.io/documentation/user/current/execution/execution_hooks.html). These methods are available for each type of hook:

"Before" hooks:

- **`gauge.hooks.beforeSuite (fn, [opts])`** - Executed before the test suite begins
- **`gauge.hooks.beforeSpec  (fn, [opts])`** - Executed before each specification
- **`gauge.hooks.beforeScenario (fn, [opts])`** - Executed before each scenario
- **`gauge.hooks.beforeStep (fn, [opts])`**- Execute before each step

"After" hooks:

- **`gauge.hooks.afterSuite (fn, [opts])`** - Executed after the test suite begins
- **`gauge.hooks.afterSpec  (fn, [opts])`** - Executed after each specification
- **`gauge.hooks.afterScenario (fn, [opts])`** - Executed after each scenario
- **`gauge.hooks.afterStep (fn, [opts])`**- Execute after each step

Here's an example of a hook that is executed before each scenario:

```js
gauge.hooks.beforeScenario (function () {
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
gauge.hooks.beforeScenario (function () {
  assert.equal(vowels[0], "a");
}, { tags: [ "single word" ]});
```

### Custom messages

**`gauge.message(<string>)`**: Use the `gauge.message(<String>)` function to send custom messages to `gauge` in your step implementations. This method takes only one string as an argument. You can call it multiple times to send multiple messages within the same step.

Example:

```js
gauge.step("Vowels in English language are <vowels>.", function(vowelsGiven) {
  gauge.message("Vowels are " + vowelsGiven);
});
```

### Data Stores

Step implementations can share custom data across scenarios, specifications and suites using data stores.

There are 3 different types of data stores based on the lifecycle of when it gets cleared.

#### Scenario store

This data store keeps values added to it in the lifecycle of the scenario execution. Values are cleared after every scenario executes.

**Store a value:**

```js
gauge.dataStore.scenarioStore.put(key, value);
```

**Retrieve a value:**

```js
gauge.dataStore.scenarioStore.get(key);
```

#### Specification store

This data store keeps values added to it in the lifecycle of the specification execution. Values are cleared after every specification executes.

**Store a value:**

```js
gauge.dataStore.specStore.put(key, value);
```

**Retrieve a value:**

```js
gauge.dataStore.specStore.get(key);
```

#### Suite store

This data store keeps values added to it in the lifecycle of the entire suite's execution. Values are cleared after entire suite executes.

**Store a value:**

```js
gauge.dataStore.suiteStore.put(key, value);
```

**Retrieve a value:**

```js
gauge.dataStore.suiteStore.get(key);
```

**Note:** Suite Store is not advised to be used when executing specs in parallel. The values are not retained between parallel streams of execution.

### Custom screenshot hook

You can specify a custom function to grab a screenshot on step failure. By default, `gauge-js` takes screenshot of the current screen using the `gauge_screenshot` binary.

This custom function should be set on the `gauge.screenshotFn` property in test implementation code and it should return a base64 encoded string of the image data that `gauge-js` will use as image content on failure.

```js
gauge.screenshotFn = function () {
    return "base64encodedstring";
};
```

### Refactoring

`gauge-js` supports refactoring your specifications and step implementations. Refactoring can be done using the following command signature:

```sh
$ gauge --refactor "Existing step text" "New step text"
```

The JS runner plugin will alter the step text and callback signature in your step implementations. It does not change the callback body.

### Debugging

`gauge-js` supports debugging your test implementation code using [node-inspector](https://github.com/node-inspector/node-inspector).

#### Requirements

- Ensure you have the latest Chrome browser and `node-inspector` installed. Please consult the [node-inspector documentation](https://github.com/node-inspector/node-inspector) for installation instructions.
- Ensure that the binaries `node-debug` and `node-inspector` are available on `PATH`.

#### Starting gauge-js with debugger

You can do either of these:

- Set the `DEBUG` key to `true` in `env/<env-name>/js.properties` file in your `gauge` project.
- Set the environment variable `DEBUG=true` when calling `gauge`. Like: `DEBUG=true gauge specs/`. This needs `gauge v0.3.2` or newer.

#### How it works

Setting the debug option will launch the runner code through `node-debug`. It will start `node-inspector`, launch Chrome DevTools and pause on the first line of execution. You will need to continue execution to let `gauge` carry on with its execution.

You can set `debugger;` inside step implementation or hook callbacks to pause execution in the debugger. This retains the `gauge` context and gives you a full blown debugger to debug your test implementations.

Example:

```js
gauge.step("There are <num> vowels.", function (num) {
  debugger;
  assert.equal(num, 5);
});
```

This will pause the debugger when this step's callback is executed by `gauge-js`.

#### Caveats

- The debugger exposes entire gauge-js runner code.
- You need to be quick enough to hit continue in the browser when `node-inspector` launches. If this takes too long, `gauge` will timeout connecting to the API. A workaround for this is to increase the `runner_connection_timeout` property to an acceptable value.

## Configuration

JavaScript specific configuration changes can be made in the `env/default/js.properties` file.

| Property                 | Default      |  Description                                                                     |
|--------------------------|--------------|----------------------------------------------------------------------------------|
| **`test_timeout`**       | `1000`       | Specify test timeout in milliseconds. If any async test takes more time than specified by this option, `gauge-js` will fail that test. Default value is `1000ms`.|

Example:

```js
test_timeout=1500
```

| Property                 | Default      |  Description                                                                                     |
|--------------------------|--------------|--------------------------------------------------------------------------------------------------|
| **`DEBUG`**              | `false`      | Set this to `true` to start with the debugger. Read [Debugging](#debugging) for more information.|

Example:

```js
DEBUG=true
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

![GNU Public License version 3.0](http://www.gnu.org/graphics/gplv3-127x51.png)
Gauge-JS is released under [GNU Public License version 3.0](http://www.gnu.org/licenses/gpl-3.0.txt)
