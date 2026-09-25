/** @type {import('jest').Config} */
export default {
    rootDir: '.',
    testMatch: ['<rootDir>/.github/migration-verifier/tests/**/*.jest.spec.ts'],
    testEnvironment: 'node',
};
