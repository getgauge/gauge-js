# Refactoring

`gauge-js` supports refactoring your specifications and step implementations. Refactoring can be done using the following command signature:

```sh
$ gauge --refactor "Existing step text" "New step text"
```

The JS runner plugin will alter the step text and callback signature in your step implementations. It does not change the callback body.
