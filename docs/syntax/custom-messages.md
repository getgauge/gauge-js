# Custom messages

**Syntax: `gauge.message(<string>)`**

Use the `gauge.message(<String>)` function to send custom messages to `gauge` in your step implementations. This method takes only one string as an argument. You can call it multiple times to send multiple messages within the same step.

Example:

```js
gauge.step("Vowels in English language are <vowels>.", function (vowelsGiven) {
  gauge.message("Vowels are " + vowelsGiven);
});
```
