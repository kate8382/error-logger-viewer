/// <reference types="jest" />

import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

let serverProc: ChildProcess | null = null;
const PORT = process.env.TEST_BACKEND_PORT || '34567';
const BASE = `http://127.0.0.1:${PORT}`;

// добавляем jest timeout для запуска сервера
jest.setTimeout(20000);

const dbPath = path.join(__dirname, '..', '..', 'backend', 'db.json');
const backupPath = path.join(__dirname, '..', '..', 'backend', 'db.test.backup.json');

beforeAll(async () => {
  // резервная копия db.json для последующего восстановления
  try {
    await fs.copyFile(dbPath, backupPath);
  } catch (e) {
    // игнорировать, если отсутствует
  }
  // запуск процесса node с компилированным сервером (чтобы среда выполнения Jest не нужно было импортировать ESM)
  serverProc = spawn(process.execPath, ['backend/dist/server.js'], {
    env: { ...process.env, PORT },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // ожидание запуска сервера с помощью опроса
  const base = `http://127.0.0.1:${PORT}`;
  const max = Date.now() + 5000;
  // eslint-disable-next-line no-constant-condition
  while (Date.now() < max) {
    try {
        const res = await fetch(`${base}/errors`).catch(() => null);
      if (res && (res.status === 200 || res.status === 404)) {
        return;
      }
    } catch (e) {
      // игнорировать
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Server did not start in time');
});

afterAll(async () => {
  // восстановление оригинального db.json
  try {
    await fs.copyFile(backupPath, dbPath);
    await fs.rm(backupPath);
  } catch (e) {
    // ignore
  }
  if (serverProc) {
    serverProc.kill();
    serverProc = null;
  }
});

describe('backend API (projects & errors)', () => {
  test('POST /projects creates project', async () => {
    const payload = { name: 'test-project', owner: 'owner@example.com' };
    const res = await request(BASE).post('/projects').send(payload).expect(201).expect('Content-Type', /json/);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('apiKey');
    expect(res.body.name).toBe(payload.name);
  });

  test('POST /errors creates error and GET /errors returns it', async () => {
    // create project first to make sure error links to a project
    const proj = await request(BASE).post('/projects').send({ name: 'p2', owner: 'u@x' }).expect(201);
    const createErr = { message: 'boom', type: 'Error', projectId: proj.body.id };
    const post = await request(BASE).post('/errors').send(createErr).expect(201).expect('Content-Type', /json/);
    expect(post.body).toHaveProperty('id');
    const list = await request(BASE).get('/errors').expect(200).expect('Content-Type', /json/);
    const found = list.body.find((e: any) => e.id === post.body.id);
    expect(found).toBeTruthy();
    expect(found.message).toBe('boom');
  });

  test('POST /users creates user and GET /users returns it', async () => {
    const u = { email: 'u1@example.com', name: 'User One' };
    const res = await request(BASE).post('/users').send(u).expect(201).expect('Content-Type', /json/);
    expect(res.body).toHaveProperty('id');
    const list = await request(BASE).get('/users').expect(200).expect('Content-Type', /json/);
    const found = list.body.find((x: any) => x.id === res.body.id);
    expect(found).toBeTruthy();
    expect(found.email).toBe(u.email);
  });
});
