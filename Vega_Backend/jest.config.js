module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFiles: ["<rootDir>/tests/setup.js"],
  collectCoverageFrom: ["<rootDir>/**/*.js", "!**/node_modules/**"],
};
