export default {
  testEnvironment: "node",

  testMatch: ["<rootDir>/__tests__/**/*.test.js"],

  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  collectCoverageFrom: [
    "src/**/*.js",
    "!src/config/**",
    "!src/constants/**",
  ],

  clearMocks: true,
  verbose: true,
};