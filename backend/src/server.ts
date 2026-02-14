/* eslint-disable prettier/prettier */
// Импорт библиотек
import express, { Request, Response } from 'express'; // ответственный за создание сервера и маршрутов
import cors from 'cors'; // для обработки CORS (Cross-Origin Resource Sharing)
import { Low } from 'lowdb'; // легковесная база данных
import { JSONFile } from 'lowdb/node'; // адаптер для работы с JSON файлами
import { fileURLToPath } from 'url'; // для получения пути к файлу
import { dirname, join } from 'path'; // для работы с путями
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid'; // для генерации уникальных идентификаторов
import { DBSchema } from './types/db';
import type { ProjectDTO } from 'projects';

// Настройка базы данных
const __filename = fileURLToPath(import.meta.url); // получение пути к текущему файлу
const __dirname = dirname(__filename);

const adapter = new JSONFile<DBSchema>(join(__dirname, 'db.json'));
const db: Low<DBSchema> = new Low(adapter, { errors: [], projects: [] } as DBSchema);

// Инициализация базы данных
await db.read();
if (!db.data) db.data = { errors: [], projects: [] };
await db.write();
console.log('db.data:', db.data);

// Загружаем общие лимиты периодов из config/periods.json
let PERIOD_LIMITS = { day: 7, week: 8, month: 6, year: 4 };
try {
  // Try to use dynamic import with json assertion when Node supports it
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const cfg = await import('../config/periods.json', { assert: { type: 'json' } });
  if (cfg && cfg.default) PERIOD_LIMITS = cfg.default;
} catch (e) {
  // Fallback: read JSON file using fs to support older Node versions
  try {
    const raw = await fs.readFile(join(__dirname, '..', 'config', 'periods.json'), 'utf8');
    const cfgJson = JSON.parse(raw);
    // eslint-disable-next-line no-unused-vars
    if (cfgJson) PERIOD_LIMITS = cfgJson;
  } catch (e2) {
    console.warn('[server] Could not load config/periods.json, using defaults', e, e2);
  }
}

// Инициализация структуры данных, если она отсутствует
if (!db.data) db.data = { errors: [], projects: [] };
else {
  db.data.errors = db.data.errors || [];
  db.data.projects = db.data.projects || [];
}

// Создание приложения Express
const app = express();

// Настройка CORS: разрешать все в разработке, только нужные origin в продакшене
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = [
  'https://kate8382.github.io', // для публикации на GitHub Pages
];
if (isProd) {
  app.use(cors({ origin: allowedOrigins }));
} else {
  app.use(cors()); // разрешить все в разработке
}
app.use(express.json()); // для обработки JSON-запросов

// Helper функции для проектов
// 1. Генерация API ключа
function generateApiKey() {
  return uuidv4();
}

// 2. Поиск проекта по API ключу
function findProjectByApiKey(key: string | undefined): ProjectDTO | null {
  if (!key) return null;
  return (db.data.projects.find((p) => p.apiKey === key) as ProjectDTO) || null;
}

// 3. Поиск проекта по ID
function findProjectById(id: string | undefined): ProjectDTO | null {
  if (!id) return null;
  return (db.data.projects.find((p) => p.id === id) as ProjectDTO) || null;
}

// 4. Поиск проекта по владельцу или участнику
function findProjectByOwnerOrMember(email: string | undefined): ProjectDTO | null {
  if (!email) return null;
  return (
    db.data.projects.find((p) => p.owner === email || (Array.isArray(p.members) && p.members.includes(email))) as ProjectDTO
  ) || null;
}

// 5. Построение сниппета с заданным API ключом
function buildSnippet(apiKey: string | undefined) {
  const escapedKey = String(apiKey || '');
  return `<script>(function(){const API_KEY='${escapedKey}';const ENDPOINT=window.__ERROR_LOGGER_ENDPOINT__||location.protocol+'//'+location.host+'/errors';function send(payload){try{fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign(payload,{apiKey:API_KEY}))});}catch(e){}}window.addEventListener('error',function(e){send({message:e.message,stack:(e.error&&e.error.stack)||e.message,type:'error',user:navigator.userAgent});});window.addEventListener('unhandledrejection',function(e){send({message:(e.reason&&e.reason.message)||String(e.reason),stack:e.reason&&e.reason.stack,type:'unhandledrejection',user:navigator.userAgent});});})();</script>`;
}

// Маршрут для создания нового проекта
app.post('/projects', async (req: Request, res: Response) => {
  const { name, owner, members } = req.body || {};
  if (!name || !owner) {
    return res.status(400).json({ error: 'Project name and owner are required' });
  }
  await db.read();
  if (!db.data) db.data = { errors: [], projects: [] };
  db.data.errors = db.data.errors || [];
  db.data.projects = db.data.projects || [];
  const id = uuidv4();
  const apiKey = generateApiKey();
  const project = {
    id,
    name,
    owner,
    members: Array.isArray(members) ? members : members ? [members] : [],
    apiKey,
    snippet: buildSnippet(apiKey),
    firstSeen: new Date().toISOString(),
  };
  db.data.projects.push(project);
  await db.write();
  // Возвращаем без раскрытия массива участников, если только владелец не запрашивает (пока возвращаем полный объект)
  return res.status(201).json(project);
});

app.get('/projects', async (req: Request, res: Response) => {
  await db.read();
  let projects = db.data.projects || [];
  if (req.query.owner) {
    const ownerQ = String(req.query.owner);
    projects = projects.filter((p) => p.owner === ownerQ || (p.members && p.members.includes(ownerQ)));
  }
  res.json(projects);
});

// Маршрут для получения статистики ошибок
app.get('/errors/stats', async (req: Request, res: Response) => {
  await db.read();
  const errors = db.data.errors || [];
  const by = String(req.query.by || 'status');
  const group = String(req.query.group || 'status');
  console.log('[STATS] Запрос:', { by, group });
  let result: Record<string, any> = {};
  // Группировка по статусу
  if (by === 'status') {
    const statusResultMain = errors.reduce<Record<string, number>>((acc, e) => {
      const status = e.status || 'new';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    result = statusResultMain;
  }
  // Группировка по типу
  else if (by === 'type') {
    const typeResult = errors.reduce<Record<string, number>>((acc, e) => {
      const type = e.type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    result = typeResult;
  }
  // Группировка по дням/неделям/месяцам/годам
  else if (['day', 'week', 'month', 'year'].includes(by)) {
    function getPeriodKey(dateStr: string, by: string): string {
        if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      if (by === 'day') {
        return dateStr.slice(0, 10);
      }
      if (by === 'week') {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
        return `${d.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
      }
      if (by === 'month') {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }
      if (by === 'year') {
        return `${date.getFullYear()}`;
      }
      return '';
    }
    result = {};
    errors.forEach((e) => {
      // Используем lastSeen для группировки по периоду
      const dateStr = e.firstSeen || '';
      const periodKey = getPeriodKey(dateStr, by);
      if (!periodKey) return;
      if (!result[periodKey]) result[periodKey] = {};
      const key = group === 'type' ? (e.type || 'Unknown') : (e.status || 'new');
      result[periodKey][key] = (result[periodKey][key] || 0) + 1;
    });
    // Применяем ограничение по числу периодов для уменьшения объёма данных,
    // если это необходимо (напр., дни/недели/месяцы/годы).
    const PERIOD_LIMITS: Record<string, number> = { day: 7, week: 8, month: 6, year: 4 };
    const sortedKeys = Object.keys(result).sort();
    const lim = (PERIOD_LIMITS as Record<string, number>)[by] ?? 0;

    if (lim > 0 && sortedKeys.length > lim) {
      const last = sortedKeys.slice(-lim);
      const filtered: Record<string, Record<string, number>> = {};
      last.forEach((k) => {
        filtered[k] = result[k];
      });
      return res.json(filtered);
    }
    return res.json(result);
  }
  // Если параметр некорректный — по умолчанию возвращаем по статусу
  else {
    const statusResult = errors.reduce<Record<string, number>>((acc, e) => {
      const status = e.status || 'new';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    result = statusResult;
  }
  console.log('[STATS] Результат:', result);
  return res.json(result);
});

// Маршрут для получения ошибок
app.get('/errors', async (req: Request, res: Response) => {
  await db.read();
  let errors = db.data.errors || [];

  // Универсальная фильтрация по любому query-параметру (кроме служебных)
  const filterKeys = Object.keys(req.query).filter((k) => !['sort', 'order', 'filter'].includes(k));
  if (filterKeys.length > 0) {
    errors = errors.filter((e) => {
      const anyE = e as any; // для динамического доступа к полям
      return filterKeys.every((key) => {
        // Приводим к строке и сравниваем без регистра
        return anyE[key] !== undefined && String(anyE[key]).toLowerCase().includes(String(req.query[key]).toLowerCase());
      });
    });
  }

  // Фильтрация по типу ошибки (старый вариант, если используется filter)
  if (req.query.filter) {
    const filterVal = String(req.query.filter).toLowerCase();
    errors = errors.filter((e) => String((e as any).type).toLowerCase() === filterVal);
  }

  // Сортировка по полю
  if (req.query.sort) {
    const order = String(req.query.order) === 'desc' ? -1 : 1;
    const sortKey = String(req.query.sort);
    if (sortKey === 'status') {
      const statusOrder = ['new', 'in_progress', 'fixed', 'ignored'];
      errors = errors.sort((a, b) => {
        const aStatus = (String((a as any).status || 'new')).toLowerCase();
        const bStatus = (String((b as any).status || 'new')).toLowerCase();
        const aIndex = statusOrder.indexOf(aStatus);
        const bIndex = statusOrder.indexOf(bStatus);
        if (aIndex !== -1 && bIndex !== -1) return (aIndex - bIndex) * order;
        if (aIndex !== -1) return -1 * order;
        if (bIndex !== -1) return 1 * order;
        return aStatus.localeCompare(bStatus) * order;
      });
    } else if (sortKey === 'count') {
      errors = errors.sort((a, b) => {
        return ((Number((a as any).count || 0) - Number((b as any).count || 0))) * order;
      });
    } else if (sortKey === 'firstSeen') {
      const getFirstSeen = (err: any) => err.firstSeen || '';
      errors = errors.sort((a, b) => {
        const aValue = getFirstSeen(a) ? new Date(getFirstSeen(a)).getTime() : 0;
        const bValue = getFirstSeen(b) ? new Date(getFirstSeen(b)).getTime() : 0;
        return (aValue - bValue) * order;
      });
    } else if (sortKey === 'lastSeen') {
      const getLastSeen = (err: any) => err.lastSeen || '';
      errors = errors.sort((a, b) => {
        const aValue = getLastSeen(a) ? new Date(getLastSeen(a)).getTime() : 0;
        const bValue = getLastSeen(b) ? new Date(getLastSeen(b)).getTime() : 0;
        return (aValue - bValue) * order;
      });
    } else {
      errors = errors.sort((a, b) => {
        const anyA = a as any;
        const anyB = b as any;
        if (anyA[sortKey] < anyB[sortKey]) return -1 * order;
        if (anyA[sortKey] > anyB[sortKey]) return 1 * order;
        return 0;
      });
    }
  }
  res.json(errors);
});

// Маршрут для добавления новой ошибки
app.post('/errors', async (req: Request, res: Response) => {
  const newError: any = req.body;
  if (!newError || !newError.message) {
    return res.status(400).json({ error: 'Invalid error data' });
  }

  await db.read();
  if (!db.data) db.data = { errors: [], projects: [] };
  db.data.errors = db.data.errors || [];
  db.data.projects = db.data.projects || [];

  // Разрешение проекта: заголовок X-API-KEY -> body.apiKey -> body.projectId -> email владельца в body или пользователя
  const headerApiKey = String(req.headers['x-api-key'] || req.headers['X-API-KEY'] || '');
  const bodyApiKey = String(newError.apiKey || newError.key || '');
  const bodyProjectId = String(newError.projectId || '');
  let project = null;
  if (headerApiKey) project = findProjectByApiKey(headerApiKey);
  if (!project && bodyApiKey) project = findProjectByApiKey(bodyApiKey);
  if (!project && bodyProjectId) project = findProjectById(bodyProjectId);
  //  Попытка разрешения email владельца/участника (используйте newError.owner || newError.user, если похоже на email)
  if (!project) {
    const maybeEmail = newError.owner || newError.user || '';
    if (typeof maybeEmail === 'string' && maybeEmail.includes('@')) {
      project = findProjectByOwnerOrMember(maybeEmail);
    }
  }
  // Если все еще не найден — помечаем как неизвестный (мягкий режим)
  const projectId = project ? project.id : 'unknown';

  // Ключи для группировки + дата
  const groupKeys = ['type', 'message', 'stack'];
  const user = newError.user || 'unknown';
  const now = new Date().toISOString();
  // Получаем день ошибки (YYYY-MM-DD)
  const day = now.slice(0, 10);

  // Нормализуем сравниваемые поля (trim, toLowerCase, пустая строка вместо undefined)
  function normalize(val: any) {
    return val === undefined || val === null ? '' : String(val).trim().toLowerCase();
  }

  let found = db.data.errors.find((e) =>
    // группируем только в рамках одного проекта (или оба неизвестны)
    String((e as any).projectId || 'unknown') === String(projectId) &&
    groupKeys.every((k) => normalize((e as any)[k]) === normalize(newError[k])) &&
    (e as any).firstSeen && (e as any).firstSeen.slice(0, 10) === day,
  );

  if (found) {
    // Увеличиваем count, обновляем lastSeen, добавляем пользователя
    found.count = (found.count || 1) + 1;
    found.lastSeen = now;
    if (!found.users) found.users = [];
    if (!found.users.includes(user)) found.users.push(user);
    // проверяем наличие projectId у найденной ошибки
    if (!found.projectId) found.projectId = projectId;
    await db.write();
    return res.status(200).json(found);
  } else {
    // Создаём новую уникальную ошибку (на этот день)
    const errorObj = {
      id: uuidv4(),
      projectId: projectId,
      type: newError.type,
      message: newError.message,
      stack: newError.stack,
      status: newError.status || 'new',
      comment: newError.comment || '',
      count: 1,
      firstSeen: now,
      lastSeen: now,
      users: [user],
    };
    db.data.errors.push(errorObj);
    await db.write();
    return res.status(201).json(errorObj);
  }
});

// Маршрут для обновления ошибки по ID
app.put('/errors/:id', async (req: Request, res: Response) => {
  const updatedError: any = req.body;
  if (!updatedError || !updatedError.message) {
    return res.status(400).json({ error: 'Invalid error data' });
  }

  await db.read();
  if (!db.data || !db.data.errors) {
    return res.status(404).json({ error: 'No errors found' });
  }

  const index = db.data.errors.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Error not found' });
  }

  updatedError.id = db.data.errors[index].id; // Сохраняем оригинальный ID
  // Обновляем lastSeen при любом изменении
  updatedError.lastSeen = new Date().toISOString();
  db.data.errors[index] = updatedError;

  await db.write();
  res.json(updatedError);
});

// Маршрут для получения ошибки по ID
app.get('/errors/:id', async (req: Request, res: Response) => {
  await db.read();
  if (!db.data || !db.data.errors) {
    return res.status(404).json({ error: 'No errors found' });
  }

  const error = db.data.errors.find((e) => e.id === req.params.id);
  if (!error) {
    return res.status(404).json({ error: 'Error not found' });
  }

  res.json(error);
});

// Маршрут для удаления ошибки по ID
app.delete('/errors/:id', async (req: Request, res: Response) => {
  await db.read();
  if (!db.data || !db.data.errors) {
    return res.status(404).json({ error: 'No errors found' });
  }

  const index = db.data.errors.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Error not found' });
  }

  db.data.errors.splice(index, 1);
  await db.write();
  res.status(204).end();
});

// Запуск сервера
const PORT: number = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

// Экспорт приложения для тестирования
export default app;
