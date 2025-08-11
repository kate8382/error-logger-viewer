// Импорт библиотек
import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Настройка базы данных
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const adapter = new JSONFile(join(__dirname, 'db.json'));
const db = new Low(adapter, { errors: [] });

// Инициализация базы данных
await db.read();
await db.write();
console.log('db.data:', db.data);

// Создание приложения Express
const app = express();
app.use(cors());
app.use(express.json()); // для обработки JSON-запросов

// Маршрут для получения ошибок
app.get('/errors', async (req, res) => {
  await db.read();
  let errors = db.data.errors || [];

  // Фильтрация по типу ошибки
  if (req.query.filter) {
    errors = errors.filter(e => String(e.type).toLowerCase() === String(req.query.filter).toLowerCase());
  }

  // Сортировка по полю
  if (req.query.sort) {
    const order = req.query.order === 'desc' ? -1 : 1;
    errors = errors.sort((a, b) => {
      if (a[req.query.sort] < b[req.query.sort]) return -1 * order;
      if (a[req.query.sort] > b[req.query.sort]) return 1 * order;
      return 0;
    });
  }

  res.json(errors);
});

// Маршрут для добавления новой ошибки
app.post('/errors', async (req, res) => {
  const newError = req.body;
  if (!newError || !newError.message) {
    return res.status(400).json({ error: 'Invalid error data' });
  }

  await db.read();
  if (!db.data || !db.data.errors) {
    db.data = { errors: [] };
  }

  newError.id = uuidv4(); // Генерация уникального ID
  if (db.data.errors.some(e => e.id === newError.id)) {
    return res.status(400).json({ error: 'Error with this ID already exists' });
  }
  newError.createdAt = new Date().toISOString();
  // updatedAt не добавляем при создании!
  db.data.errors.push(newError);
  await db.write();

  res.status(201).json(newError);
});

// Маршрут для обновления ошибки по ID
app.put('/errors/:id', async (req, res) => {
  const updatedError = req.body;
  if (!updatedError || !updatedError.message) {
    return res.status(400).json({ error: 'Invalid error data' });
  }

  await db.read();
  if (!db.data || !db.data.errors) {
    return res.status(404).json({ error: 'No errors found' });
  }

  const index = db.data.errors.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Error not found' });
  }

  updatedError.id = db.data.errors[index].id; // Сохраняем оригинальный ID
  updatedError.createdAt = db.data.errors[index].createdAt; // Сохраняем дату создания
  updatedError.updatedAt = new Date().toISOString();
  db.data.errors[index] = updatedError;

  await db.write();
  res.json(updatedError);
});

// Маршрут для получения ошибки по ID
app.get('/errors/:id', async (req, res) => {
  await db.read();
  if (!db.data || !db.data.errors) {
    return res.status(404).json({ error: 'No errors found' });
  }

  const error = db.data.errors.find(e => e.id === req.params.id);
  if (!error) {
    return res.status(404).json({ error: 'Error not found' });
  }

  res.json(error);
});

// Маршрут для удаления ошибки по ID
app.delete('/errors/:id', async (req, res) => {
  await db.read();
  if (!db.data || !db.data.errors) {
    return res.status(404).json({ error: 'No errors found' });
  }

  const index = db.data.errors.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Error not found' });
  }

  db.data.errors.splice(index, 1);
  await db.write();
  res.status(204).end();
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Экспорт приложения для тестирования
export default app;


