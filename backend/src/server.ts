/* eslint-disable prettier/prettier */
// =============================================================================
// server.ts — Error Logger Viewer Backend
// =============================================================================
// This is the single-file Express backend. It uses lowdb (a lightweight JSON
// file database) and exposes REST endpoints for errors, projects, and users.
//
// ARCHITECTURE NOTE: All routes live in this one file for now. As the project
// grows, consider splitting into: routes/, services/, middleware/.
// =============================================================================

// --- Standard library & third-party imports ---
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
// helmet sets secure HTTP response headers (X-Frame-Options, CSP, etc.)
import helmet from 'helmet';
// rateLimit protects write endpoints from flooding
import rateLimit from 'express-rate-limit';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { DBSchema } from './types/db';
import type { ProjectDTO } from 'projects';
import type { CreateErrorRequest, UpdateErrorRequest } from 'errors';
import type { UserDTO } from 'users';

// =============================================================================
// DATABASE SETUP
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// DB_FILE env var can override the default db.json location (e.g. for Docker
// volumes). We resolve the path and keep it as-is — operators are responsible
// for setting a safe path. Log it at startup so it's visible in the process log.
const dbFile = process.env.DB_FILE
  ? resolve(process.env.DB_FILE)
  : join(__dirname, '..', 'db.json');

console.log(`[server] Using DB file: ${dbFile}`);

const adapter = new JSONFile<DBSchema>(dbFile);
const db: Low<DBSchema> = new Low(adapter, { errors: [], projects: [], users: [] } as DBSchema);

// --- Single, authoritative DB initialisation block ---
// (Previously this was duplicated twice — now consolidated here.)
await db.read();
if (!db.data) {
  db.data = { errors: [], projects: [], users: [] };
}
db.data.errors   = db.data.errors   || [];
db.data.projects = db.data.projects || [];
db.data.users    = db.data.users    || [];
await db.write();
console.log(
  `[server] DB loaded: ${db.data.errors.length} errors, ` +
  `${db.data.projects.length} projects, ${db.data.users.length} users`
);

// =============================================================================
// PERIOD LIMITS (loaded once at startup from config/periods.json)
// =============================================================================
// IMPORTANT: This outer constant must NOT be re-declared inside any route
// handler. The inner shadowing bug has been removed (see /errors/stats route).

let PERIOD_LIMITS: Record<string, number> = { day: 7, week: 8, month: 6, year: 4 };
try {
  // Prefer config at the project root (standard location)
  const cfgPath = join(process.cwd(), 'config', 'periods.json');
  const raw = await fs.readFile(cfgPath, 'utf8');
  const parsed = JSON.parse(raw) as Record<string, number>;
  if (parsed && typeof parsed === 'object') PERIOD_LIMITS = parsed;
  console.log('[server] Loaded PERIOD_LIMITS from', cfgPath, PERIOD_LIMITS);
} catch {
  try {
    // Fallback: look next to the compiled bundle (backward-compat)
    const raw = await fs.readFile(join(__dirname, '..', 'config', 'periods.json'), 'utf8');
    const parsed = JSON.parse(raw) as Record<string, number>;
    if (parsed && typeof parsed === 'object') PERIOD_LIMITS = parsed;
    console.log('[server] Loaded PERIOD_LIMITS from bundle dir', PERIOD_LIMITS);
  } catch {
    console.warn('[server] config/periods.json not found — using default PERIOD_LIMITS', PERIOD_LIMITS);
  }
}

// =============================================================================
// UTILITY: GROUP ERRORS BY TIME PERIOD
// =============================================================================
// Hoisted to module scope so it is defined once (not re-created per request).
// Returns an ISO-style key for the period containing `dateStr`.
function getPeriodKey(dateStr: string, by: string): string {
  // Guard: return empty string for invalid inputs so callers can skip them.
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  if (by === 'day') {
    // YYYY-MM-DD
    return dateStr.slice(0, 10);
  }
  if (by === 'week') {
    // ISO week number: YYYY-Www
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // treat Sunday as 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
  }
  if (by === 'month') {
    // YYYY-MM
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }
  if (by === 'year') {
    return `${date.getFullYear()}`;
  }
  return '';
}

// =============================================================================
// UTILITY: PROJECT LOOKUPS
// =============================================================================

/** Find a project by its API key. Returns null if not found. */
function findProjectByApiKey(key: string | undefined): ProjectDTO | null {
  if (!key) return null;
  return (db.data.projects.find((p) => p.apiKey === key) as ProjectDTO) || null;
}

/** Find a project by its UUID. Returns null if not found. */
function findProjectById(id: string | undefined): ProjectDTO | null {
  if (!id) return null;
  return (db.data.projects.find((p) => p.id === id) as ProjectDTO) || null;
}

/** Find a project by owner email or member email. */
function findProjectByOwnerOrMember(email: string | undefined): ProjectDTO | null {
  if (!email) return null;
  return (
    db.data.projects.find(
      (p) => p.owner === email || (Array.isArray(p.members) && p.members.includes(email))
    ) as ProjectDTO
  ) || null;
}

/** Build the client-side JS snippet that posts errors to this backend. */
function buildSnippet(apiKey: string | undefined): string {
  // Ensure the key is a plain string — no template injection possible since
  // apiKey is always a UUID generated by us (see generateApiKey).
  const escapedKey = String(apiKey || '');
  return `<script>(function(){if((window).__ERROR_LOGGER_SNIPPET_ADDED__){return;} (window).__ERROR_LOGGER_SNIPPET_ADDED__=true; const PROJECT_KEY='${escapedKey}';const ENDPOINT=window.__ERROR_LOGGER_ENDPOINT__||location.protocol+'//'+location.host+'/errors';function send(payload){try{fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign(payload,{apiKey:PROJECT_KEY}))});}catch(e){}}window.addEventListener('error',function(e){send({message:e.message,stack:(e.error&&e.error.stack)||e.message,type:'error',user:navigator.userAgent});});window.addEventListener('unhandledrejection',function(e){send({message:(e.reason&&e.reason.message)||String(e.reason),stack:e.reason&&e.reason.stack,type:'unhandledrejection',user:navigator.userAgent});});})();</script>`;
}

/** Generate a new random API key (UUID v4). */
function generateApiKey(): string {
  return uuidv4();
}

// =============================================================================
// UTILITY: INPUT VALIDATION HELPERS
// =============================================================================

/** Valid status values for an error record. */
const VALID_STATUSES = new Set(['new', 'in_progress', 'fixed', 'ignored', 'unknown']);

/**
 * Sanitise a string value: coerce to string, trim whitespace, and truncate
 * to `maxLen` characters to prevent unbounded data storage.
 */
function sanitizeString(val: unknown, maxLen = 2000): string {
  if (val === undefined || val === null) return '';
  return String(val).trim().slice(0, maxLen);
}

/**
 * Normalise a string for duplicate-detection comparisons:
 * lowercase + trimmed, empty string for null/undefined.
 */
function normalize(val: unknown): string {
  if (val === undefined || val === null) return '';
  return String(val).trim().toLowerCase();
}

// =============================================================================
// EXPRESS APP + MIDDLEWARE STACK
// =============================================================================

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// --- 1. Security headers (helmet) ---
// Sets X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP, etc.
// Must be first in the middleware chain so headers are set on every response.
app.use(helmet());

// --- 2. CORS ---
// In production: only allow the known GitHub Pages origin.
// In development: only allow localhost variants to avoid accidental wide-open dev servers.
const allowedOrigins = ['https://kate8382.github.io'];
const devOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
];

if (isProd) {
  app.use(cors({ origin: allowedOrigins }));
} else {
  // Dev: restrict to localhost — not fully open anymore.
  app.use(cors({ origin: devOrigins }));
}

// --- 3. Body parsing with payload size limit ---
// 50 kB cap prevents a single oversized POST from exhausting memory.
app.use(express.json({ limit: '50kb' }));

// --- 4. Rate limiters for write endpoints ---
// Applied per-route below, but defined here for clarity.

/** General write limiter: 100 requests per 15 minutes per IP. */
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // return RateLimit headers in the response
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

/** Stricter limiter for the error ingestion endpoint (higher expected volume). */
const errorIngestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 error reports per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Error report rate limit exceeded.' },
});

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================
// A lightweight API key guard. For write endpoints (POST /projects, admin
// operations) we require a valid project API key in the X-API-KEY header.
//
// NOTE: The /errors POST endpoint handles its own project-key lookup because
// it needs to associate the error with a project, not just authenticate the
// caller. Management endpoints (PUT/DELETE) use this middleware.

/**
 * Middleware that verifies X-API-KEY corresponds to an existing project.
 * Attaches the resolved project to `req` as `(req as any).project`.
 */
function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  // Accept the key from the header or (as a fallback) from the request body.
  const headerKey = sanitizeString(req.headers['x-api-key'] as string | undefined, 128);
  const bodyKey   = sanitizeString((req.body as Record<string, unknown>)?.apiKey as string | undefined, 128);
  const key = headerKey || bodyKey;

  const project = findProjectByApiKey(key);
  if (!project) {
    res.status(401).json({ error: 'Invalid or missing API key.' });
    return;
  }
  // Attach resolved project so route handlers can use it without re-querying.
  (req as Request & { project: ProjectDTO }).project = project;
  next();
}

// =============================================================================
// PRODUCTION: SERVE FRONTEND STATIC FILES
// =============================================================================
// IMPORTANT: The SPA fallback (catch-all) must be registered BEFORE the API
// routes so that it can hand off to `next()` cleanly — but we use a prefix
// check to avoid swallowing API requests. All API routes are registered below.

const frontendDist = join(__dirname, '..', '..', 'frontend', 'dist');
if (isProd && existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA fallback: serve index.html for any route that isn't an API endpoint.
  // API prefixes are: /errors, /projects, /users.
  // This catch-all is registered first but explicitly skips API paths.
  app.get(/.*/, (req: Request, res: Response, next: NextFunction) => {
    const apiPrefixes = ['/errors', '/projects', '/users'];
    const isApiRoute = apiPrefixes.some((prefix) => req.path.startsWith(prefix));
    if (isApiRoute) {
      // Pass control to the actual API route handlers registered below.
      return next();
    }
    res.sendFile(join(frontendDist, 'index.html'));
  });
}

// =============================================================================
// ROUTES: PROJECTS
// =============================================================================

/** POST /projects — Create a new project. */
app.post('/projects', writeLimiter, async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown> || {};

  // Validate required fields.
  const name  = sanitizeString(body.name, 200);
  const owner = sanitizeString(body.owner, 200);
  if (!name || !owner) {
    return res.status(400).json({ error: 'Project name and owner are required.' });
  }

  await db.read();
  if (!db.data) db.data = { errors: [], projects: [], users: [] };
  db.data.projects = db.data.projects || [];

  // Normalise members to an array of sanitised strings.
  let members: string[] = [];
  if (Array.isArray(body.members)) {
    members = (body.members as unknown[]).map((m) => sanitizeString(m, 200)).filter(Boolean);
  } else if (body.members) {
    const single = sanitizeString(body.members, 200);
    if (single) members = [single];
  }

  const id     = uuidv4();
  const apiKey = generateApiKey();
  const project: ProjectDTO = {
    id,
    name,
    owner,
    members,
    apiKey,
    snippet: buildSnippet(apiKey),
    firstSeen: new Date().toISOString(),
  };
  db.data.projects.push(project);
  await db.write();
  return res.status(201).json(project);
});

/** GET /projects — List projects, optionally filtered by ?owner=email. */
app.get('/projects', async (req: Request, res: Response) => {
  await db.read();
  let projects = db.data.projects || [];

  if (req.query.owner) {
    const ownerQ = sanitizeString(req.query.owner as string, 200);
    projects = projects.filter(
      (p) => p.owner === ownerQ || (Array.isArray(p.members) && p.members.includes(ownerQ))
    );
  }

  // Strip sensitive fields (apiKey, snippet) from the public response.
  const sanitized = projects.map((p) => ({
    id:        p.id,
    name:      p.name,
    owner:     p.owner,
    members:   p.members,
    firstSeen: p.firstSeen,
  }));
  res.json(sanitized);
});

// =============================================================================
// ROUTES: USERS
// =============================================================================

/** POST /users — Register a user (upsert by email). */
app.post('/users', writeLimiter, async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown> || {};
  const email = sanitizeString(body.email, 200);
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  await db.read();
  if (!db.data) db.data = { errors: [], projects: [], users: [] } as DBSchema;
  db.data.users = db.data.users || [];

  // Upsert: return existing record if this email is already known.
  const existing = db.data.users.find((u: UserDTO) => u.email === email);
  if (existing) return res.status(200).json(existing);

  const id   = uuidv4();
  // Accept either 'name' or 'username'; prefer 'name' to match stored format.
  const name = sanitizeString(body.name ?? body.username, 200);
  const user: UserDTO = {
    id,
    email,
    name: name || '',
    createdAt: new Date().toISOString(),
  };
  db.data.users.push(user);
  await db.write();
  return res.status(201).json(user);
});

/** GET /users — List all users. */
app.get('/users', async (req: Request, res: Response) => {
  await db.read();
  res.json(db.data.users || []);
});

/** GET /users/:id — Get a single user by ID. */
app.get('/users/:id', async (req: Request, res: Response) => {
  await db.read();
  const u = (db.data.users || []).find((x: UserDTO) => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found.' });
  return res.json(u);
});

// =============================================================================
// ROUTES: ERRORS — STATS
// =============================================================================

/**
 * GET /errors/stats — Return aggregate counts grouped by `by` parameter.
 * Supported values: 'status' | 'type' | 'day' | 'week' | 'month' | 'year'
 */
app.get('/errors/stats', async (req: Request, res: Response) => {
  await db.read();
  const errors = db.data.errors || [];

  // Validate the 'by' parameter against a known set.
  const validBy = new Set(['status', 'type', 'day', 'week', 'month', 'year']);
  const by      = sanitizeString(req.query.by as string | undefined, 20);
  const group   = sanitizeString(req.query.group as string | undefined, 20);
  const safeBy  = validBy.has(by) ? by : 'status'; // default to 'status' for unknown values

  let result: Record<string, unknown> = {};

  if (safeBy === 'status') {
    // Count errors by their status value.
    result = errors.reduce<Record<string, number>>((acc, e) => {
      const status = e.status || 'new';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

  } else if (safeBy === 'type') {
    // Count errors by their type value.
    result = errors.reduce<Record<string, number>>((acc, e) => {
      const type = e.type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

  } else {
    // Time-period grouping: 'day' | 'week' | 'month' | 'year'
    // Uses the module-level getPeriodKey() — NOT a locally-redeclared copy.
    // Uses the module-level PERIOD_LIMITS — loaded from config/periods.json at startup.
    const periodResult: Record<string, Record<string, number>> = {};

    errors.forEach((e) => {
      const dateStr   = e.firstSeen || '';
      const periodKey = getPeriodKey(dateStr, safeBy);
      if (!periodKey) return; // skip records with no/invalid date

      if (!periodResult[periodKey]) periodResult[periodKey] = {};
      // Determine the sub-grouping key: type or status.
      const subKey = group === 'type' ? (e.type || 'Unknown') : (e.status || 'new');
      periodResult[periodKey][subKey] = (periodResult[periodKey][subKey] || 0) + 1;
    });

    // Trim to the configured number of most-recent periods.
    const sortedKeys = Object.keys(periodResult).sort();
    const lim        = PERIOD_LIMITS[safeBy] ?? 0; // uses the config-loaded constant

    if (lim > 0 && sortedKeys.length > lim) {
      // Keep only the last `lim` periods.
      const last = sortedKeys.slice(-lim);
      const trimmed: Record<string, Record<string, number>> = {};
      last.forEach((k) => { trimmed[k] = periodResult[k]; });
      return res.json(trimmed);
    }
    return res.json(periodResult);
  }

  return res.json(result);
});

// =============================================================================
// ROUTES: ERRORS — CRUD
// =============================================================================

/**
 * GET /errors — List errors, with optional filtering and sorting.
 *
 * Query params:
 *   - Any field name: filters by substring match (case-insensitive)
 *   - filter:  legacy type filter (equivalent to ?type=value)
 *   - sort:    field to sort by ('status' | 'count' | 'firstSeen' | 'lastSeen')
 *   - order:   'asc' | 'desc'
 */
app.get('/errors', async (req: Request, res: Response) => {
  await db.read();
  let errors = db.data.errors || [];

  // Allowlist of known sortable/filterable field names to prevent arbitrary
  // field probing (information leakage via filter timing).
  const ALLOWED_FILTER_KEYS = new Set([
    'projectId', 'type', 'status', 'message', 'stack', 'comment',
  ]);
  const RESERVED_KEYS = new Set(['sort', 'order', 'filter']);

  // Apply field filters from query params.
  const filterKeys = Object.keys(req.query).filter(
    (k) => !RESERVED_KEYS.has(k) && ALLOWED_FILTER_KEYS.has(k)
  );
  if (filterKeys.length > 0) {
    errors = errors.filter((e) => {
      const anyE = e as unknown as Record<string, unknown>;
      return filterKeys.every((key) => {
        const val = anyE[key];
        return (
          val !== undefined &&
          String(val).toLowerCase().includes(
            sanitizeString(req.query[key] as string, 200).toLowerCase()
          )
        );
      });
    });
  }

  // Legacy ?filter= parameter (filters by type).
  if (req.query.filter) {
    const filterVal = sanitizeString(req.query.filter as string, 100).toLowerCase();
    errors = errors.filter((e) => String(e.type || '').toLowerCase() === filterVal);
  }

  // Sorting.
  if (req.query.sort) {
    const order   = sanitizeString(req.query.order as string, 10) === 'desc' ? -1 : 1;
    const sortKey = sanitizeString(req.query.sort as string, 50);

    if (sortKey === 'status') {
      const statusOrder = ['new', 'in_progress', 'fixed', 'ignored'];
      errors = errors.slice().sort((a, b) => {
        const aStatus = String(a.status || 'new').toLowerCase();
        const bStatus = String(b.status || 'new').toLowerCase();
        const aIndex  = statusOrder.indexOf(aStatus);
        const bIndex  = statusOrder.indexOf(bStatus);
        if (aIndex !== -1 && bIndex !== -1) return (aIndex - bIndex) * order;
        if (aIndex !== -1) return -1 * order;
        if (bIndex !== -1) return 1 * order;
        return aStatus.localeCompare(bStatus) * order;
      });
    } else if (sortKey === 'count') {
      errors = errors.slice().sort((a, b) => (Number(a.count || 0) - Number(b.count || 0)) * order);
    } else if (sortKey === 'firstSeen') {
      errors = errors.slice().sort((a, b) => {
        const aVal = a.firstSeen ? new Date(a.firstSeen).getTime() : 0;
        const bVal = b.firstSeen ? new Date(b.firstSeen).getTime() : 0;
        return (aVal - bVal) * order;
      });
    } else if (sortKey === 'lastSeen') {
      errors = errors.slice().sort((a, b) => {
        const aVal = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
        const bVal = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
        return (aVal - bVal) * order;
      });
    }
    // Unknown sort keys are silently ignored (no sort applied).
  }

  res.json(errors);
});

/**
 * POST /errors — Ingest a new error report from a client snippet.
 *
 * Project resolution order:
 *   1. X-API-KEY header
 *   2. body.apiKey / body.key
 *   3. body.projectId
 *   4. body.owner or body.user if it looks like an email
 *
 * Errors for the same project + type + message + stack on the same calendar
 * day are de-duplicated (count is incremented instead of inserting a new row).
 */
app.post('/errors', errorIngestLimiter, async (req: Request, res: Response) => {
  // Use the typed CreateErrorRequest DTO rather than `any`.
  const body = req.body as CreateErrorRequest;

  // Validate the one required field.
  const message = sanitizeString(body?.message, 5000);
  if (!message) {
    return res.status(400).json({ error: 'Error message is required.' });
  }

  await db.read();
  if (!db.data) db.data = { errors: [], projects: [], users: [] };
  db.data.errors   = db.data.errors   || [];
  db.data.projects = db.data.projects || [];

  // --- Project resolution ---
  const headerApiKey = sanitizeString(req.headers['x-api-key'] as string | undefined, 128);
  const bodyApiKey   = sanitizeString(body.apiKey, 128);
  const bodyProjectId = sanitizeString(body.projectId, 128);

  let project: ProjectDTO | null = null;
  if (headerApiKey) project = findProjectByApiKey(headerApiKey);
  if (!project && bodyApiKey)    project = findProjectByApiKey(bodyApiKey);
  if (!project && bodyProjectId) project = findProjectById(bodyProjectId);
  if (!project) {
    // Last resort: try to match by owner/member email in the body.
    // Cast through unknown to access the non-standard 'owner' field safely.
    const bodyAny = body as unknown as Record<string, unknown>;
    const maybeEmail = sanitizeString(bodyAny.owner as string || body.user, 200);
    if (maybeEmail && maybeEmail.includes('@')) {
      project = findProjectByOwnerOrMember(maybeEmail);
    }
  }
  // If no project matched, mark as 'unknown' (soft mode — don't reject the error).
  const projectId = project ? project.id : 'unknown';

  // --- Sanitise incoming fields ---
  const type    = sanitizeString(body.type, 100);
  const stack   = sanitizeString(body.stack, 10000);
  const user    = sanitizeString(body.user, 500) || 'unknown';
  const now     = new Date().toISOString();
  const day     = now.slice(0, 10); // YYYY-MM-DD

  // --- De-duplication: group same error on same day in same project ---
  const found = db.data.errors.find((e) =>
    String(e.projectId || 'unknown') === String(projectId) &&
    normalize(e.type)    === normalize(type)    &&
    normalize(e.message) === normalize(message) &&
    normalize(e.stack)   === normalize(stack)   &&
    e.firstSeen          && e.firstSeen.slice(0, 10) === day
  );

  if (found) {
    // Existing record: increment count, update lastSeen, add user.
    found.count = (found.count || 1) + 1;
    found.lastSeen = now;
    if (!found.users) found.users = [];
    if (!found.users.includes(user)) found.users.push(user);
    if (!found.projectId) found.projectId = projectId;
    await db.write();
    return res.status(200).json(found);
  }

  // New error record for this day.
  const errorObj = {
    id:        uuidv4(),
    projectId,
    type:      type || 'error',
    message,
    stack,
    status:    'new' as const,
    comment:   '',
    count:     1,
    firstSeen: now,
    lastSeen:  now,
    users:     [user],
  };
  db.data.errors.push(errorObj);
  await db.write();
  return res.status(201).json(errorObj);
});

/**
 * GET /errors/:id — Get a single error record by ID.
 */
app.get('/errors/:id', async (req: Request, res: Response) => {
  await db.read();
  if (!db.data?.errors) {
    return res.status(404).json({ error: 'No errors found.' });
  }
  const error = db.data.errors.find((e) => e.id === req.params.id);
  if (!error) return res.status(404).json({ error: 'Error not found.' });
  res.json(error);
});

/**
 * PUT /errors/:id — Update an error record.
 *
 * SECURITY: Only the following fields may be updated by a caller:
 *   - status  (must be a valid status value)
 *   - comment (free text, capped at 2000 chars)
 *
 * All other fields (id, projectId, message, stack, count, firstSeen, users)
 * are preserved from the existing DB record and cannot be overwritten.
 * This prevents full record replacement attacks and data tampering.
 */
app.put('/errors/:id', requireApiKey, writeLimiter, async (req: Request, res: Response) => {
  // Use the typed UpdateErrorRequest DTO.
  const body = req.body as Partial<UpdateErrorRequest>;
  if (!body) {
    return res.status(400).json({ error: 'Request body is required.' });
  }

  await db.read();
  if (!db.data?.errors) {
    return res.status(404).json({ error: 'No errors found.' });
  }

  const index = db.data.errors.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Error not found.' });

  // Only allow patching of safe, explicitly-listed fields.
  // Cast through unknown first because ErrorRecord has no index signature.
  const existing = db.data.errors[index];
  const rawStatus = sanitizeString(body.status as string | undefined, 20);

  if (rawStatus && !VALID_STATUSES.has(rawStatus)) {
    return res.status(400).json({
      error: `Invalid status value. Must be one of: ${[...VALID_STATUSES].join(', ')}.`,
    });
  }

  // Merge only the allowed fields; all other fields remain unchanged.
  const updated = {
    ...existing,
    // Apply safe fields if present in the request body.
    ...(rawStatus ? { status: rawStatus as 'new' | 'in_progress' | 'fixed' | 'ignored' | 'unknown' } : {}),
    ...(body.comment !== undefined ? { comment: sanitizeString(body.comment, 2000) } : {}),
    // Always update lastSeen on any successful PUT.
    lastSeen: new Date().toISOString(),
  };

  db.data.errors[index] = updated;
  await db.write();
  return res.json(updated);
});

/**
 * DELETE /errors/:id — Delete an error record by ID.
 * Requires a valid API key (uses requireApiKey middleware).
 */
app.delete('/errors/:id', requireApiKey, writeLimiter, async (req: Request, res: Response) => {
  await db.read();
  if (!db.data?.errors) {
    return res.status(404).json({ error: 'No errors found.' });
  }

  const index = db.data.errors.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Error not found.' });

  db.data.errors.splice(index, 1);
  await db.write();
  // 204 No Content — no body on successful delete.
  res.status(204).end();
});

// =============================================================================
// SERVER START
// =============================================================================

const PORT: number = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Running on http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
});

// Export for test suites (supertest etc.)
export default app;
