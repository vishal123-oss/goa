/**
 * Goa Framework - Users CRUD Example
 * Run with: node examples/users-crud.js
 */

import Goa from '../index.js';

const app = new Goa();
const users = new Map();
let nextId = 1;

const now = () => new Date().toISOString();

const normalizeString = value => (typeof value === 'string' ? value.trim() : '');

const readJsonBody = async ctx => {
  try {
    return await ctx.request.json();
  } catch (error) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid JSON payload.' };
    return null;
  }
};

const validateCreatePayload = payload => {
  if (!payload || typeof payload !== 'object') {
    return 'Payload must be a JSON object.';
  }
  if (!normalizeString(payload.name) || !normalizeString(payload.email)) {
    return 'Both name and email are required.';
  }
  return null;
};

const validateUpdatePayload = payload => {
  if (!payload || typeof payload !== 'object') {
    return 'Payload must be a JSON object.';
  }
  const hasUpdates = [payload.name, payload.email, payload.role].some(value => normalizeString(value));
  if (!hasUpdates) {
    return 'Provide at least one of name, email, or role to update.';
  }
  return null;
};

const parseUserId = path => {
  const match = path.match(/^\/users\/(\d+)$/);
  return match ? Number(match[1]) : null;
};

app.use(async (ctx, next) => {
  const start = ctx.startTime;
  await next();
  ctx.set('X-Response-Time', ctx.response.getResponseTime(start));
});

app.use(async ctx => {
  ctx.response.cors();

  if (ctx.path === '/') {
    ctx.body = {
      message: 'Goa Users CRUD Demo',
      endpoints: {
        list: 'GET /users',
        create: 'POST /users',
        read: 'GET /users/:id',
        update: 'PUT /users/:id',
        remove: 'DELETE /users/:id'
      }
    };
    return;
  }

  if (ctx.path === '/users' && ctx.method === 'GET') {
    const role = normalizeString(ctx.query.role);
    const results = Array.from(users.values()).filter(user => !role || user.role === role);
    ctx.response.cacheControl(30);
    ctx.body = { data: results, count: results.length };
    return;
  }

  if (ctx.path === '/users' && ctx.method === 'POST') {
    const payload = await readJsonBody(ctx);
    if (!payload) return;

    const error = validateCreatePayload(payload);
    if (error) {
      ctx.status = 400;
      ctx.body = { error };
      return;
    }

    const user = {
      id: nextId++,
      name: normalizeString(payload.name),
      email: normalizeString(payload.email),
      role: normalizeString(payload.role) || 'member',
      createdAt: now(),
      updatedAt: now()
    };

    users.set(user.id, user);
    ctx.status = 201;
    ctx.body = { data: user };
    return;
  }

  const userId = parseUserId(ctx.path);
  if (userId !== null) {
    const existing = users.get(userId);

    if (ctx.method === 'GET') {
      if (!existing) {
        ctx.status = 404;
        ctx.body = { error: 'User not found.' };
        return;
      }
      ctx.body = { data: existing };
      return;
    }

    if (ctx.method === 'PUT') {
      if (!existing) {
        ctx.status = 404;
        ctx.body = { error: 'User not found.' };
        return;
      }

      const payload = await readJsonBody(ctx);
      if (!payload) return;

      const error = validateUpdatePayload(payload);
      if (error) {
        ctx.status = 400;
        ctx.body = { error };
        return;
      }

      const updated = {
        ...existing,
        ...(normalizeString(payload.name) ? { name: normalizeString(payload.name) } : {}),
        ...(normalizeString(payload.email) ? { email: normalizeString(payload.email) } : {}),
        ...(normalizeString(payload.role) ? { role: normalizeString(payload.role) } : {}),
        updatedAt: now()
      };

      users.set(userId, updated);
      ctx.body = { data: updated };
      return;
    }

    if (ctx.method === 'DELETE') {
      if (!existing) {
        ctx.status = 404;
        ctx.body = { error: 'User not found.' };
        return;
      }

      users.delete(userId);
      ctx.status = 204;
      ctx.body = null;
      return;
    }
  }

  ctx.status = 404;
  ctx.body = { error: 'Not Found' };
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`\n🚀 Goa users API running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET    /users');
  console.log('  POST   /users');
  console.log('  GET    /users/:id');
  console.log('  PUT    /users/:id');
  console.log('  DELETE /users/:id\n');
});
