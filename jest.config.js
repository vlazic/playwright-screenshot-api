export default {
  testEnvironment: "node",
  transform: {},
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/__tests__/**/*.test.js"],
  setupFilesAfterEnv: ["./__tests__/setup.js"],
  coveragePathIgnorePatterns: ["/node_modules/", "/__tests__/", "/coverage/"],
  verbose: true,
};
