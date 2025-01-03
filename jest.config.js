export default {
  testEnvironment: "node",
  transform: {},
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/tests/**/*.test.js"],
  setupFilesAfterEnv: ["./tests/setup.js"],
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/", "/coverage/"],
  verbose: true,
  testEnvironmentOptions: {
    env: {
      NODE_ENV: "test",
    },
  },
};
