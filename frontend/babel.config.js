// Для Jest, т.к. сам по себе не поддерживает ES-модули и современный синтаксис — ему нужен Babel для преобразования.
/* eslint-disable no-undef */
module.exports = {
  presets: ['@babel/preset-env'], // пресет для поддержки современного JS
};