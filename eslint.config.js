import js from "@eslint/js";
import tseslint from "typescript-eslint";

import importPlugin from "eslint-plugin-import";
import promisePlugin from "eslint-plugin-promise";
import securityPlugin from "eslint-plugin-security";

export default [
  // --------------------------------------------------
  // GLOBAL IGNORES
  // --------------------------------------------------
  {
    ignores: ["dist/**", "node_modules/**"],
  },

  // --------------------------------------------------
  // BASE JS (NODE ENV)
  // --------------------------------------------------
  {
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        fetch: "readonly"
      },
    },
  },

  // --------------------------------------------------
  // TYPESCRIPT (NODE BACKEND)
  // --------------------------------------------------
  {
    files: ["src/**/*.ts"],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: process.cwd(),
        sourceType: "module",
      },
    },

    plugins: {
      "@typescript-eslint": tseslint.plugin,
      import: importPlugin,
      promise: promisePlugin,
      security: securityPlugin,
    },

    rules: {
      // -------------------------------
      // KEEP THESE STRICT (REAL BUGS)
      // -------------------------------
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: false }
      ],

      // -------------------------------
      // CLEAN BUT PRACTICAL
      // -------------------------------
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" }
      ],

      "no-console": "off",      // backend logs allowed
      "no-undef": "off",        // Node globals handled above

      // -------------------------------
      // IMPORT ORDER (KEEP, AUTO-FIX)
      // -------------------------------
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always"
        }
      ],

      // -------------------------------
      // PROMISE SAFETY
      // -------------------------------
      "promise/catch-or-return": "error",
      "promise/no-nesting": "warn",

      // -------------------------------
      // SECURITY (Prisma false positives)
      // -------------------------------
      "security/detect-object-injection": "off"
    },
  },
];
