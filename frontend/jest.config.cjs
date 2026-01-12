// настройки Jest для фронтенда

module.exports = {
  testEnvironment: 'jsdom', // имитация браузерной среды
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest', // трансформация JS/TS (и JSX/TSX) с помощью Babel
  },
  // Use V8 coverage provider to avoid babel-plugin-istanbul incompatibilities in CI
  coverageProvider: 'v8',
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'], // расширения файлов
  moduleDirectories: ['node_modules', 'src/scripts'], // где искать модули
  roots: ['<rootDir>/src/scripts'], // корневая папка с исходным кодом
  collectCoverage: true, // сбор информации о покрытии кода тестами
  coverageDirectory: '<rootDir>/coverage', // папка для отчётов о покрытии
  coverageReporters: ['text', 'lcov'], // форматы отчётов о покрытии
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'], // шаблоны имён файлов тестов
  verbose: true, // подробный вывод результатов тестов
};
