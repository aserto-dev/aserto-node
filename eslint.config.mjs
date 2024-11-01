import { fixupConfigRules } from "@eslint/compat";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import typescriptSortKeys from "eslint-plugin-typescript-sort-keys";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    files: ["lib/**/*"],
    ignores: ["dist/**/*.js"],
}, ...fixupConfigRules(compat.extends(
    "prettier",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
)), {
    plugins: {
        "simple-import-sort": simpleImportSort,
        "typescript-sort-keys": typescriptSortKeys,
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2018,
        sourceType: "module",
    },

    rules: {
        curly: "error",
        eqeqeq: ["error", "always"],
        "no-console": "warn",
        "no-debugger": "warn",
        "no-duplicate-case": "error",
        "no-use-before-define": "off",

        "@typescript-eslint/consistent-type-assertions": ["error", {
            assertionStyle: "as",
            objectLiteralTypeAssertions: "allow-as-parameter",
        }],

        "@typescript-eslint/explicit-module-boundary-types": "off",

        "@typescript-eslint/naming-convention": [1, {
            selector: "interface",
            format: ["PascalCase"],
        }],

        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-var-requires": "off",
        "prettier/prettier": ["error"],


        "simple-import-sort/imports": ["warn", {
            groups: [["^\\u0000"], ["^\\w", "^@"], ["^"], ["^\\."]],
        }],

        "typescript-sort-keys/string-enum": ["error", "asc", {
            caseSensitive: false,
            natural: true,
        }],

        '@typescript-eslint/no-unused-expressions': ['error',
            {
                "allowShortCircuit": true,
                "allowTernary": true
            }
        ],

        "@typescript-eslint/no-empty-interface": "off",

        "@typescript-eslint/no-explicit-any": ["error", {
            fixToUnknown: true,
        }],

        "no-unused-vars": "off",

        "@typescript-eslint/no-unused-vars": ["warn", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
        }],
    },
}];
