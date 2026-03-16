/**
 * Goa Framework - Users CRUD Example
 * Run with: node examples/users-crud.js
 */

import Goa, { Runner } from '../index.js';

const app = new Goa();

// Demonstrate Runner access - middleware runs sequentially between request/response
const runner = app.getRunner();
console.log('[Users CRUD] Runner initialized, middleware count:', runner.count);

const users = new Map();
let nextId = 1;

const now = () => new Date().toISOString();

const normalizeString = value => (typeof value === 'string' ? value.trim() : '');

const readJsonBody = async ctx => {
  try {
    return await ctx.request.json();
  } catch (error) {
    ctx.response.sendStatus(400, { error: 'Invalid JSON payload.' });
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

// Response time middleware
app.use(async (ctx, next) => {
  const start = ctx.startTime;
  await next();
  ctx.set('X-Response-Time', ctx.response.getResponseTime(start));
});

// CORS middleware
app.use(async (ctx, next) => {
  ctx.response.cors();
  await next();
});

// Root endpoint
app.get('/', async (ctx) => {
  ctx.status = 200;
  // Objects are JSON stringified automatically
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
});

// Health check
app.get('/health', async (ctx) => {
  ctx.response.set({
    'X-App': 'goa-users',
    'X-Status': 'ok'
  });
  // Plain string sent as text/plain
  ctx.body = 'ok';
});

// List all users
app.get('/users', async (ctx) => {
  const role = normalizeString(ctx.query.role);
  const results = Array.from(users.values()).filter(user => !role || user.role === role);
  ctx.response.cacheControl(30);
  ctx.response.links({
    self: '/users',
    create: '/users'
  });
  ctx.body = { data: results, count: results.length };
});

// Create user
app.post('/users', async (ctx) => {
  const payload = await readJsonBody(ctx);
  if (!payload) return;

  const error = validateCreatePayload(payload);
  if (error) {
    ctx.response.sendStatus(400, { error });
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
});

// Get user by ID
app.get('/users/:id', async (ctx) => {
  const userId = Number(ctx.params.id);
  const existing = users.get(userId);
  if (!existing) {
    ctx.response.sendStatus(404, { error: 'User not found.' });
    return;
  }
  ctx.body = { data: existing };
});

// Update user by ID
app.put('/users/:id', async (ctx) => {
  const userId = Number(ctx.params.id);
  const existing = users.get(userId);
  if (!existing) {
    ctx.response.sendStatus(404, { error: 'User not found.' });
    return;
  }

  const payload = await readJsonBody(ctx);
  if (!payload) return;

  const error = validateUpdatePayload(payload);
  if (error) {
    ctx.response.sendStatus(400, { error });
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
});

// Delete user by ID
app.delete('/users/:id', async (ctx) => {
  const userId = Number(ctx.params.id);
  const existing = users.get(userId);
  if (!existing) {
    ctx.response.sendStatus(404, { error: 'User not found.' });
    return;
  }

  users.delete(userId);
  ctx.status = 204;
  ctx.body = null;
});

// 404 handler
app.use(async (ctx) => {
  if (!ctx.body) {
    ctx.status = 404;
    ctx.body = { error: 'Not Found' };
  }
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
