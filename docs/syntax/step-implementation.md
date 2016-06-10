# Step implementation

**Syntax: `gauge.step(<step-text>, fn, [done]) { ... }`**

Use the `gauge.step()` method to implement your steps. For example:

```js
gauge.step("Vowels in English language are <vowels>.", function (vowelsGiven) {
  assert.equal(vowelsGiven, "aeiou");
});
```

## Multiple step names

To implement the same function for multiple step names (aka, step aliases), pass an `array` of `strings` as the first argument to `gauge.step()`. For example:

```js
gauge.step(["Create a user <username>", "Create another user <username>"], function (username) {
  // do cool stuff
});
```

## Async operations in step implementation

If test code involves asynchronous operations, invoke the optional callback when the test is done. Including this optional parameter (`done` in the following example) in step function or execution hook makes runner to wait for the completion of the async operation.

```js
gauge.step("Vowels in English language are <vowels>", function (vowels, done) {
  setTimeout(function () {
    done();
  }, 1000);
});
```

### Handling assertions and errors in async tests

If an asynchronous test code can throw an error, or if you use assertions in an asynchronous test, wrap the assertions in a `try-catch` block and pass the error to `done()`:

```js
gauge.step("I am run async and I may fail", function (done) {
    setTimeout(function () {
        try {
            assert.equal(true, false);
        } catch (e) {
            done(e);
        }
    }, 1000);
});
```
