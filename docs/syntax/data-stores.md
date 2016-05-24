# Data Stores

Step implementations can share custom data across scenarios, specifications and suites using data stores.

There are 3 different types of data stores based on the lifecycle of when it gets cleared.

## Scenario store

This data store keeps values added to it in the lifecycle of the scenario execution. Values are cleared after every scenario executes.

**Store a value:**

```js
gauge.dataStore.scenarioStore.put(key, value);
```

**Retrieve a value:**

```js
gauge.dataStore.scenarioStore.get(key);
```

## Specification store

This data store keeps values added to it in the lifecycle of the specification execution. Values are cleared after every specification executes.

**Store a value:**

```js
gauge.dataStore.specStore.put(key, value);
```

**Retrieve a value:**

```js
gauge.dataStore.specStore.get(key);
```

## Suite store

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
