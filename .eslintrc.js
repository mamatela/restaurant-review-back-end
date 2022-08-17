module.exports = {
  "extends": "eslint:recommended",
  "env": {
      "commonjs": true,
      "es6": true,
      "node": true,
      "jest": true,
      "jest/globals": true
  },
  "plugins": ["jest"],
  "rules": {
    "jest/no-disabled-tests": "warn",
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
    "jest/prefer-to-have-length": "warn",
    "jest/valid-expect": "error"
  },
  "parserOptions": {
    "ecmaVersion": 2020
  },
};