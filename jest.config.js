/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  maxWorkers: 1,
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["topaz.ts"],
  coveragePathIgnorePatterns: ["topaz.ts"],
};
