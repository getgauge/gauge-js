import mocha from "eslint-plugin-mocha";

export default [
  {
    plugins: {
      mocha
    },
    languageOptions: {
      ecmaVersion: 8,
      globals: {
        node: true,
        es6: true,
        mocha: true
      }
    },
    rules: {
      curly: "error",
      indent: [
        "error",
        2
      ],
      "linebreak-style": [
        "error",
        "unix"
      ],
      "mocha/no-exclusive-tests": "error",
      "no-console": "off",
      quotes: [
        "error",
        "double"
      ],
      semi: [
        "error",
        "always"
      ]
    }
  }
];
