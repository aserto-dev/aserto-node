/* eslint-env es6 */
/* eslint-disable no-console */

const defaultConfigs = require("@aserto/ts-linting-configs");

module.exports = {
  ...defaultConfigs,
  rules: {
    ...defaultConfigs.rules,
    "@typescript-eslint/naming-convention": defaultConfigs.rules[
      "@typescript-eslint/naming-convention"
    ].filter((rule) => rule.selector !== "property"),
    "@typescript-eslint/ban-types": [
      "error",
      {
        extendDefaults: true,
        types: { "{}": false },
      },
    ],
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-explicit-any": [
      "error",
      {
        fixToUnknown: true,
      },
    ],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
  },
};
