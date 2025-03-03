import perfectionist from "eslint-plugin-perfectionist";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { fixupConfigRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  allConfig: js.configs.all,
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    files: ["lib/**/*"],
    ignores: ["dist/**/*.js"],
  },
  ...fixupConfigRules(
    compat.extends(
      "prettier",
      "plugin:@typescript-eslint/recommended",
      "plugin:prettier/recommended",
    ),
  ),
  perfectionist.configs["recommended-natural"],
  {
    languageOptions: {
      ecmaVersion: 2018,
      parser: tsParser,
      sourceType: "module",
    },

    plugins: {},

    rules: {
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "allow-as-parameter",
        },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/naming-convention": [
        1,
        {
          format: ["PascalCase"],
          selector: "interface",
        },
      ],
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-explicit-any": [
        "error",
        {
          fixToUnknown: true,
        },
      ],

      "@typescript-eslint/no-inferrable-types": "off",

      "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",

      "@typescript-eslint/no-non-null-assertion": "off",

      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true,
          allowTernary: true,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-var-requires": "off",
      curly: "error",
      eqeqeq: ["error", "always"],
      "no-console": "warn",

      "no-debugger": "warn",

      "no-duplicate-case": "error",

      "no-unused-vars": "off",

      "no-use-before-define": "off",
      "perfectionist/sort-enums": [
        "warn",
        {
          partitionByComment: true,
          partitionByNewLine: true,
        },
      ],
      "perfectionist/sort-imports": [
        "warn",
        {
          internalPattern: ["^@"],
          specialCharacters: "keep",
        },
      ],
      "perfectionist/sort-maps": [
        "warn",
        {
          partitionByComment: true,
          partitionByNewLine: true,
        },
      ],
      "perfectionist/sort-objects": "off",
      "perfectionist/sort-object-types": "off",
      "perfectionist/sort-interfaces": "off",
      "perfectionist/sort-classes": "off",
      "perfectionist/sort-enums": "off",

      "prettier/prettier": ["error"],
    },
  },
];
