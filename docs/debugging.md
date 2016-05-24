# Debugging

`gauge-js` supports debugging your test implementation code using [node-inspector](https://github.com/node-inspector/node-inspector).

## Requirements

- Ensure you have the latest Chrome browser and `node-inspector` installed. Please consult the [node-inspector documentation](https://github.com/node-inspector/node-inspector) for installation instructions.
- Ensure that the binaries `node-debug` and `node-inspector` are available on `PATH`.

## Starting gauge-js with debugger

You can do either of these:

- Set the `DEBUG` key to `true` in `env/<env-name>/js.properties` file in your `gauge` project.
- Set the environment variable `DEBUG=true` when calling `gauge`. Like: `DEBUG=true gauge specs/`. This needs `gauge v0.3.2` or newer.

## How it works

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

## Caveats

- The debugger exposes entire gauge-js runner code.
- You need to be quick enough to hit continue in the browser when `node-inspector` launches. If this takes too long, `gauge` will timeout connecting to the API. A workaround for this is to increase the `runner_connection_timeout` property to an acceptable value.
