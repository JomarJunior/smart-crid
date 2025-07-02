const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.mocha,
        // Hardhat globals
        artifacts: "readonly",
        contract: "readonly",
        ethers: "readonly",
        network: "readonly",
        web3: "readonly",
        hre: "readonly",
      },
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["warn", "double"],
      indent: ["warn", 2],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
  {
    ignores: [
      "node_modules/",
      "artifacts/",
      "cache/",
      "coverage/",
      "typechain-types/",
      "dist/",
      "build/",
      "scripts/",
    ],
  },
];
