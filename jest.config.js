/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["topaz.ts"],
  coveragePathIgnorePatterns: ["topaz.ts"],
};
