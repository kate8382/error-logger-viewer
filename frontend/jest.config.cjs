// настройки Jest для фронтенда

module.exports = {
  testEnvironment: 'jsdom', // имитация браузерной среды
  transform: {
    '^.+\\.js$': 'babel-jest', // трансформация JS с помощью Babel
  },
  moduleFileExtensions: ['js'], // расширения файлов
  moduleDirectories: ['node_modules', 'src/scripts'], // где искать модули
  roots: ['<rootDir>/src/scripts'], // корневая папка с исходным кодом
  collectCoverage: true, // сбор информации о покрытии кода тестами
  coverageDirectory: '<rootDir>/coverage', // папка для отчётов о покрытии
  coverageReporters: ['text', 'lcov'], // форматы отчётов о покрытии
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'], // шаблоны имён файлов тестов
  verbose: true, // подробный вывод результатов тестов
};
