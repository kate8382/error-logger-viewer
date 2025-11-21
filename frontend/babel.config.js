// Для Jest, т.к. сам по себе не поддерживает ES-модули и современный синтаксис — ему нужен Babel для преобразования.

module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]], // пресет для поддержки современного JS
};
