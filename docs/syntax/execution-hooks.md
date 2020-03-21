# Execution Hooks

gauge-js supports tagged [execution hooks](http://getgauge.io/documentation/user/current/execution/execution_hooks.html). These methods are available for each type of hook:

**"Before" hooks:**

- **`gauge.hooks.beforeSuite(fn, [opts]) { ... }`** - Executed before the test suite begins
- **`gauge.hooks.beforeSpec(fn, [opts]) { ... }`** - Executed before each specification
- **`gauge.hooks.beforeScenario(fn, [opts]) { ... }`** - Executed before each scenario
- **`gauge.hooks.beforeStep(fn, [opts]) { ... }`**- Execute before each step

**"After" hooks:**

- **`gauge.hooks.afterSuite(fn, [opts]) { ... }`** - Executed after the test suite ends
- **`gauge.hooks.afterSpec(fn, [opts]) { ... }`** - Executed after each specification
- **`gauge.hooks.afterScenario(fn, [opts]) { ... }`** - Executed after each scenario
- **`gauge.hooks.afterStep(fn, [opts]) { ... }`**- Execute after each step

Here's an example of a hook that is executed before each scenario:

```js
gauge.hooks.beforeScenario(function () {
  assert.equal(vowels.join(""), "aeiou");
});
```

## Hook options

Each hook takes an optional 2nd argument as an object. It can contain the following properties:

- *`tags`*: Default: `[]`.
An array of strings for the tags for which to execute the current callback. These are only useful at specification or scenario level. If not specified, the provided callback is executed on each occurrence of the hook.
- *`operator`*: Valid values: `"AND"`, `"OR"`. Default: `"AND"`.
This controls whether the current callback is executed when all of the tags match (in case of `"AND"`), or if any of the tags match (in case of `OR`).

Example of a tagged execution hook implementation:

```js
gauge.hooks.beforeScenario(function () {
  assert.equal(vowels[0], "a");
}, { tags: [ "single word" ]});
```

## Async operations in execution hooks

```js
gauge.hooks.beforeStep(function (context, done) {
  setTimeout(function() {
    done();
  }, 1000);
});
```
