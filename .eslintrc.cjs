/* eslint-env node */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: [
    "dist",
    "node_modules",
    "public/styles.css",
    "server.cjs",
    "public/app.js",
    "public/games.js"
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
  },
  overrides: [
    {
      files: ["src/client/**/*.ts"],
      rules: {
        "no-restricted-properties": ["error",
          { object: "Element.prototype",     property: "innerHTML",          message: "Use textContent or createElement — see spec Security Hardening" },
          { object: "Element.prototype",     property: "outerHTML",          message: "Use textContent or createElement" },
          { object: "Element.prototype",     property: "insertAdjacentHTML", message: "Use textContent or createElement" }
        ]
      }
    }
  ]
}
