# Configuration

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
