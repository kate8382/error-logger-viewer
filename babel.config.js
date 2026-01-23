// Unified Babel config for frontend and backend tests
// Для Jest, т.к. сам по себе не поддерживает ES-модули и современный синтаксис — ему нужен Babel для преобразования.
module.exports = {
  // eslint-disable-next-line prettier/prettier
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
};
