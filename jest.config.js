module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
      '^@config/(.*)$': '<rootDir>/config/$1',
      '^@shared/(.*)$': '<rootDir>/shared/$1',
      '^@domain/(.*)$': '<rootDir>/domain/$1',
      '^@infrastructure/(.*)$': '<rootDir>/infrastructure/$1',
      '^@helpers/(.*)$': '<rootDir>/helpers/$1',
      '^@libs/(.*)$': '<rootDir>/libs/$1',
    },
};
