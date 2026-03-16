/**
 * Goa Framework Tests
 * Basic test suite for the framework
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Readable } from 'node:stream';
import { once } from 'node:events';

// Import the framework
import Goa, { Application, Context, Request, Response, compose } from '../index.js';

test('Goa Framework', async (t) => {
  await t.test('should export Application as default', () => {
    assert.strictEqual(typeof Goa, 'function');
    assert.strictEqual(Goa, Application);
  });

  await t.test('should export all named exports', () => {
    assert.strictEqual(typeof Application, 'function');
    assert.strictEqual(typeof Context, 'function');
    assert.strictEqual(typeof Request, 'function');
    assert.strictEqual(typeof Response, 'function');
    assert.strictEqual(typeof compose, 'function');
  });

  await t.test('should create a new Application instance', () => {
    const app = new Application();
    assert.strictEqual(app instanceof Application, true);
    assert.strictEqual(Array.isArray(app.middleware), true);
    assert.strictEqual(app.middleware.length, 0);
  });

  await t.test('should have default options', () => {
    const app = new Application();
    assert.strictEqual(app.subdomainOffset, 2);
    assert.strictEqual(app.proxy, false);
    assert.strictEqual(app.env, process.env.NODE_ENV || 'development');
  });

  await t.test('should accept options in constructor', () => {
    const app = new Application({
      subdomainOffset: 3,
      proxy: true,
      env: 'test',
      silent: true
    });
    assert.strictEqual(app.subdomainOffset, 3);
    assert.strictEqual(app.proxy, true);
    assert.strictEqual(app.env, 'test');
    assert.strictEqual(app.silent, true);
  });

  await t.test('use() should add middleware', () => {
    const app = new Application();
    const fn = async (ctx, next) => await next();
    app.use(fn);
    assert.strictEqual(app.middleware.length, 1);
    assert.strictEqual(app.middleware[0], fn);
  });

  await t.test('use() should throw on non-function', () => {
    const app = new Application();
    assert.throws(() => {
      app.use('not a function');
    }, TypeError);
  });

  await t.test('use() should return app for chaining', () => {
    const app = new Application();
    const result = app.use(async (ctx, next) => await next());
    assert.strictEqual(result, app);
  });

  await t.test('compose() should compose middleware', async () => {
    const order = [];
    
    const middleware = [
      async (ctx, next) => {
        order.push(1);
        await next();
        order.push(6);
      },
      async (ctx, next) => {
        order.push(2);
        await next();
        order.push(5);
      },
      async (ctx, next) => {
        order.push(3);
        await next();
        order.push(4);
      }
    ];

    const fn = compose(middleware);
    await fn({}, async () => {});

    assert.deepStrictEqual(order, [1, 2, 3, 4, 5, 6]);
  });

  await t.test('compose() should throw on non-array', () => {
    assert.throws(() => {
      compose('not an array');
    }, TypeError);
  });

  await t.test('compose() should throw on non-function middleware', () => {
    assert.throws(() => {
      compose([1, 2, 3]);
    }, TypeError);
  });

  await t.test('compose() should handle empty array', async () => {
    const fn = compose([]);
    await assert.doesNotReject(fn({}, async () => {}));
  });

  await t.test('Request class should work', () => {
    const mockReq = {
      url: '/test?foo=bar',
      method: 'GET',
      headers: {
        host: 'localhost:3000',
        'content-type': 'application/json',
        'x-requested-with': 'XMLHttpRequest',
        accept: 'application/json'
      },
      socket: {
        encrypted: false,
        remoteAddress: '127.0.0.1'
      }
    };
    const mockRes = { statusCode: 200 };

    const request = new Request(mockReq, mockRes);
    assert.strictEqual(request.url, '/test?foo=bar');
    assert.strictEqual(request.method, 'GET');
    assert.strictEqual(request.path, '/test');
    assert.strictEqual(request.querystring, 'foo=bar');
    assert.deepStrictEqual(request.query, { foo: 'bar' });
    assert.strictEqual(request.protocol, 'http');
    assert.strictEqual(request.secure, false);
    assert.strictEqual(request.hostname, 'localhost');
    assert.strictEqual(request.xhr, true);
    assert.strictEqual(request.type, 'application/json');
    assert.strictEqual(request.expectsJson, true);
  });

  await t.test('Request should parse cookies and auth headers', async () => {
    const mockReq = {
      url: '/auth',
      method: 'GET',
      headers: {
        host: 'localhost:3000',
        cookie: 'token=abc123; theme=dark',
        authorization: `Basic ${Buffer.from('goa:secret').toString('base64')}`,
        accept: 'text/html'
      },
      socket: {
        encrypted: false,
        remoteAddress: '127.0.0.1'
      }
    };
    const mockRes = { statusCode: 200 };

    const request = new Request(mockReq, mockRes);
    assert.deepStrictEqual(request.cookies, { token: 'abc123', theme: 'dark' });
    assert.strictEqual(request.cookie('token'), 'abc123');
    assert.deepStrictEqual(request.auth, { username: 'goa', password: 'secret' });
    assert.strictEqual(request.expectsHtml, true);
    assert.strictEqual(request.isGet, true);
  });

  await t.test('Request should read and parse JSON body', async () => {
    const payload = { name: 'Goa', role: 'framework' };
    const body = JSON.stringify(payload);
    const stream = Readable.from([Buffer.from(body)]);
    stream.headers = {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(body)
    };
    stream.method = 'POST';
    stream.url = '/users';

    const request = new Request(stream, { statusCode: 200 });
    const result = await request.json();

    assert.deepStrictEqual(result, payload);
    assert.deepStrictEqual(await request.parse(), payload);
  });

  await t.test('Response should handle redirect and helpers', () => {
    const mockReq = {
      httpVersionMajor: 1,
      headers: {
        accept: 'text/html'
      }
    };
    const headers = {};
    const mockRes = {
      statusCode: 200,
      getHeaders: () => headers,
      setHeader: (key, val) => {
        headers[key.toLowerCase()] = val;
      },
      removeHeader: (key) => {
        delete headers[key.toLowerCase()];
      },
      headersSent: false,
      finished: false,
      socket: { writable: true }
    };

    const response = new Response(mockReq, mockRes);
    response.set({ 'X-Test': 'yes' });
    response.redirect('/next');
    response.cacheControl(120);
    response.noCache();
    response.cors({ origin: 'https://example.com', credentials: true });
    response.links({ self: '/users' });
    response.location('/next');

    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.get('Location'), '/next');
    assert.strictEqual(headers['cache-control'].includes('no-cache'), true);
    assert.strictEqual(headers['access-control-allow-origin'], 'https://example.com');
    assert.strictEqual(headers['access-control-allow-credentials'], 'true');
    assert.strictEqual(headers['x-test'], 'yes');
    assert.ok(headers['link'].includes('rel="self"'));
  });

  await t.test('Response should support send helpers', () => {
    const mockReq = { httpVersionMajor: 1, headers: {} };
    const headers = {};
    const mockRes = {
      statusCode: 200,
      getHeaders: () => headers,
      setHeader: (key, val) => {
        headers[key.toLowerCase()] = val;
      },
      removeHeader: (key) => {
        delete headers[key.toLowerCase()];
      },
      headersSent: false,
      finished: false,
      socket: { writable: true }
    };

    const response = new Response(mockReq, mockRes);
    response.send({ ok: true });
    assert.strictEqual(response.type, 'application/json');
    response.text('hello');
    assert.strictEqual(response.type, 'text/plain');
    response.html('<p>hi</p>');
    assert.strictEqual(response.type, 'text/html');
    response.sendStatus(202, { queued: true });
    assert.strictEqual(response.status, 202);
  });

  await t.test('Response class should work', () => {
    const mockReq = {
      httpVersionMajor: 1
    };
    const headers = {};
    const mockRes = {
      statusCode: 200,
      getHeaders: () => headers,
      setHeader: (key, val) => {
        headers[key.toLowerCase()] = val;
      },
      removeHeader: (key) => {
        delete headers[key.toLowerCase()];
      },
      headersSent: false,
      finished: false,
      socket: { writable: true }
    };

    const response = new Response(mockReq, mockRes);
    response.status = 201;
    response.statusCode = 202;
    response.statusMessage = 'Accepted';
    response.body = { ok: true };
    response.charset = 'utf-8';
    response.vary('Accept');
    response.cookie('token', 'abc123');

    assert.strictEqual(response.status, 202);
    assert.strictEqual(response.message, 'Accepted');
    assert.strictEqual(response.type, 'application/json');
    assert.ok(Number.isFinite(response.length));
    assert.ok(response.get('Vary').includes('Accept'));
    assert.ok(response.charset.includes('utf-8'));
  });

  await t.test('Context class should work', () => {
    const ctx = new Context();
    // State and respond are set by app.createContext, not constructor
    assert.ok(ctx !== null);
    assert.strictEqual(ctx.app, null);
  });
});

test('Goa HTTP Integration', async (t) => {
  const requestJson = async ({ method = 'GET', port, path, headers = {}, body }) => {
    const payload = body ? JSON.stringify(body) : null;
    const response = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          method,
          host: 'localhost',
          port,
          path,
          headers: {
            ...headers,
            ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
          }
        },
        (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data ? JSON.parse(data) : null
            });
          });
        }
      );
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });

    return response;
  };

  await t.test('should start server and respond', async () => {
    const app = new Application();
    
    app.use(async (ctx) => {
      ctx.body = { message: 'Hello Goa!' };
    });

    let callbackCalled = false;
    const server = app.listen(0, () => {
      callbackCalled = true;
    });
    
    await new Promise((resolve) => {
      server.once('listening', () => {
        const port = server.address().port;
        
        http.get(`http://localhost:${port}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            const json = JSON.parse(data);
            assert.strictEqual(json.message, 'Hello Goa!');
            assert.strictEqual(callbackCalled, true);
            server.close();
            resolve();
          });
        });
      });
    });
  });

  await t.test('should support middleware chain', async () => {
    const app = new Application();
    const order = [];
    
    app.use(async (ctx, next) => {
      order.push('a');
      await next();
      order.push('a-end');
    });
    
    app.use(async (ctx, next) => {
      order.push('b');
      ctx.body = { order };
      await next();
    });

    const server = app.listen(0);
    
    await new Promise((resolve) => {
      server.once('listening', () => {
        const port = server.address().port;
        
        http.get(`http://localhost:${port}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            assert.deepStrictEqual(order, ['a', 'b', 'a-end']);
            server.close();
            resolve();
          });
        });
      });
    });
  });

  await t.test('should set correct content-type for JSON', async () => {
    const app = new Application();
    
    app.use(async (ctx) => {
      ctx.body = { foo: 'bar' };
    });

    const server = app.listen(0);
    
    await new Promise((resolve) => {
      server.once('listening', () => {
        const port = server.address().port;
        
        http.get(`http://localhost:${port}`, (res) => {
          const contentType = res.headers['content-type'];
          assert.ok(contentType.includes('application/json'));
          server.close();
          resolve();
        });
      });
    });
  });

  await t.test('should support context helpers', async () => {
    const app = new Application();

    app.use(async (ctx) => {
      ctx.set('X-Test', 'yes');
      ctx.setCookie('session', 'abc123', { httpOnly: true });
      ctx.body = {
        ip: ctx.ip,
        cookies: ctx.cookies,
        elapsed: ctx.elapsed,
        responded: ctx.responded,
        acceptsJson: ctx.accepts('application/json')
      };
      ctx.markResponded();
    });

    const server = app.listen(0);

    await new Promise((resolve) => {
      server.once('listening', () => {
        const port = server.address().port;
        const req = http.request(
          {
            host: 'localhost',
            port,
            path: '/helpers',
            headers: {
              Cookie: 'theme=dark',
              Accept: 'application/json'
            }
          },
          (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
              const json = JSON.parse(data);
              assert.strictEqual(res.headers['x-test'], 'yes');
              assert.ok(res.headers['set-cookie']);
              assert.strictEqual(json.cookies.theme, 'dark');
              assert.ok(json.elapsed >= 0);
              assert.strictEqual(json.responded, false);
              assert.strictEqual(json.acceptsJson, 'application/json');
              server.close();
              resolve();
            });
          }
        );
        req.end();
      });
    });
  });

  await t.test('routing shortcuts should work', async () => {
    const app = new Application();

    app.get('/hello', async (ctx) => {
      ctx.response.json({ message: 'hello' });
    });

    app.post('/echo', async (ctx) => {
      const body = await ctx.request.json();
      ctx.response.json({ echo: body });
    });

    app.put('/update', async (ctx) => {
      ctx.response.json({ status: 'updated' });
    });

    app.delete('/remove', async (ctx) => {
      ctx.response.sendStatus(204, null);
    });

    app.patch('/patch', async (ctx) => {
      ctx.response.json({ status: 'patched' });
    });

    app.all('/all', async (ctx) => {
      ctx.response.json({ status: 'all' });
    });

    // 404 handler
    app.use(async (ctx) => {
      if (!ctx.body) {
        ctx.response.sendStatus(404, { error: 'Not Found' });
      }
    });

    const server = app.listen(0);

    await new Promise((resolve) => {
      server.once('listening', async () => {
        const port = server.address().port;

        // Test GET
        const getRes = await requestJson({ method: 'GET', port, path: '/hello' });
        assert.strictEqual(getRes.status, 200);
        assert.strictEqual(getRes.body.message, 'hello');

        // Test POST
        const postRes = await requestJson({ method: 'POST', port, path: '/echo', body: { test: 1 } });
        assert.strictEqual(postRes.status, 200);
        assert.deepStrictEqual(postRes.body.echo, { test: 1 });

        // Test PUT
        const putRes = await requestJson({ method: 'PUT', port, path: '/update' });
        assert.strictEqual(putRes.status, 200);
        assert.strictEqual(putRes.body.status, 'updated');

        // Test DELETE
        const delRes = await requestJson({ method: 'DELETE', port, path: '/remove' });
        assert.strictEqual(delRes.status, 204);

        // Test PATCH
        const patchRes = await requestJson({ method: 'PATCH', port, path: '/patch' });
        assert.strictEqual(patchRes.status, 200);
        assert.strictEqual(patchRes.body.status, 'patched');

        // Test ALL
        const allRes = await requestJson({ method: 'GET', port, path: '/all' });
        assert.strictEqual(allRes.status, 200);
        assert.strictEqual(allRes.body.status, 'all');

        // Test wrong method on route (now returns 404)
        const wrongRes = await requestJson({ method: 'POST', port, path: '/hello' });
        assert.strictEqual(wrongRes.status, 404);

        server.close();
        resolve();
      });
    });
  });

  await t.test('routing with path params should work', async () => {
    const app = new Application();

    app.get('/users/:id', async (ctx) => {
      ctx.response.json({ id: ctx.params.id, name: 'Test' });
    });

    app.put('/users/:id', async (ctx) => {
      ctx.response.json({ updated: ctx.params.id });
    });

    app.delete('/users/:id', async (ctx) => {
      ctx.response.sendStatus(204, null);
    });

    const server = app.listen(0);

    await new Promise((resolve) => {
      server.once('listening', async () => {
        const port = server.address().port;

        const getRes = await requestJson({ method: 'GET', port, path: '/users/123' });
        assert.strictEqual(getRes.status, 200);
        assert.strictEqual(getRes.body.id, '123');
        assert.strictEqual(getRes.body.name, 'Test');

        const putRes = await requestJson({ method: 'PUT', port, path: '/users/456' });
        assert.strictEqual(putRes.status, 200);
        assert.strictEqual(putRes.body.updated, '456');

        const delRes = await requestJson({ method: 'DELETE', port, path: '/users/789' });
        assert.strictEqual(delRes.status, 204);

        server.close();
        resolve();
      });
    });
  });

  await t.test('users CRUD integration flow', async () => {
    const app = new Application();
    const users = new Map();
    let nextId = 1;

    const readBody = async ctx => {
      try {
        return await ctx.request.json();
      } catch (error) {
        ctx.response.sendStatus(400, { error: 'Invalid JSON payload.' });
        return null;
      }
    };

    const parseUserId = path => {
      const match = path.match(/^\/users\/(\d+)$/);
      return match ? Number(match[1]) : null;
    };

    app.use(async ctx => {
      if (ctx.path === '/users' && ctx.method === 'POST') {
        const payload = await readBody(ctx);
        if (!payload) return;
        const user = {
          id: nextId++,
          name: payload.name,
          email: payload.email,
          role: payload.role || 'member'
        };
        users.set(user.id, user);
        ctx.response.statusCode = 201;
        ctx.response.json({ data: user });
        return;
      }

      if (ctx.path === '/users' && ctx.method === 'GET') {
        ctx.response.links({ self: '/users' });
        ctx.response.json({ data: Array.from(users.values()) });
        return;
      }

      const userId = parseUserId(ctx.path);
      if (userId !== null) {
        const existing = users.get(userId);
        if (!existing) {
          ctx.response.sendStatus(404, { error: 'User not found.' });
          return;
        }

        if (ctx.method === 'GET') {
          ctx.response.json({ data: existing });
          return;
        }

        if (ctx.method === 'PUT') {
          const payload = await readBody(ctx);
          if (!payload) return;
          const updated = { ...existing, ...payload };
          users.set(userId, updated);
          ctx.response.json({ data: updated });
          return;
        }

        if (ctx.method === 'DELETE') {
          users.delete(userId);
          ctx.response.sendStatus(204, null);
          return;
        }
      }

      ctx.response.sendStatus(404, { error: 'Not Found' });
    });

    const server = app.listen(0);

    await new Promise((resolve) => {
      server.once('listening', async () => {
        const port = server.address().port;

        const created = await requestJson({
          method: 'POST',
          port,
          path: '/users',
          body: { name: 'Ada', email: 'ada@example.com' }
        });

        assert.strictEqual(created.status, 201);
        assert.strictEqual(created.body.data.name, 'Ada');

        const list = await requestJson({
          method: 'GET',
          port,
          path: '/users'
        });

        assert.strictEqual(list.status, 200);
        assert.strictEqual(list.body.data.length, 1);

        const userId = created.body.data.id;
        const read = await requestJson({
          method: 'GET',
          port,
          path: `/users/${userId}`
        });

        assert.strictEqual(read.status, 200);
        assert.strictEqual(read.body.data.email, 'ada@example.com');

        const updated = await requestJson({
          method: 'PUT',
          port,
          path: `/users/${userId}`,
          body: { role: 'admin' }
        });

        assert.strictEqual(updated.status, 200);
        assert.strictEqual(updated.body.data.role, 'admin');

        const removed = await requestJson({
          method: 'DELETE',
          port,
          path: `/users/${userId}`
        });

        assert.strictEqual(removed.status, 204);

        const missing = await requestJson({
          method: 'GET',
          port,
          path: `/users/${userId}`
        });

        assert.strictEqual(missing.status, 404);
        server.close();
        resolve();
      });
    });
  });

  // Runner Tests
  await t.test('Runner', async (t) => {
    // Import Runner
    const { Runner } = await import('../index.js');

    await t.test('should export Runner', () => {
      assert.strictEqual(typeof Runner, 'function');
    });

    await t.test('should create a new Runner instance', () => {
      const runner = new Runner();
      assert.strictEqual(runner instanceof Runner, true);
      assert.strictEqual(Array.isArray(runner.middleware), true);
      assert.strictEqual(runner.middleware.length, 0);
      assert.strictEqual(runner.currentState, 'idle');
    });

    await t.test('attach() should add middleware', () => {
      const runner = new Runner();
      const fn = async (ctx, next) => await next();
      runner.attach(fn);
      assert.strictEqual(runner.middleware.length, 1);
      assert.strictEqual(typeof runner.middleware[0], 'function');
    });

    await t.test('attach() should throw on non-function', () => {
      const runner = new Runner();
      assert.throws(() => {
        runner.attach('not a function');
      }, TypeError);
    });

    await t.test('attach() should return runner for chaining', () => {
      const runner = new Runner();
      const result = runner.attach(async (ctx, next) => await next());
      assert.strictEqual(result, runner);
    });

    await t.test('attachAll() should add multiple middleware', () => {
      const runner = new Runner();
      const fn1 = async (ctx, next) => await next();
      const fn2 = async (ctx, next) => await next();
      runner.attachAll(fn1, fn2);
      assert.strictEqual(runner.middleware.length, 2);
    });

    await t.test('count getter should return middleware count', () => {
      const runner = new Runner();
      runner.attach(async (ctx, next) => await next());
      runner.attach(async (ctx, next) => await next());
      assert.strictEqual(runner.count, 2);
    });

    await t.test('remove() should remove middleware by index', () => {
      const runner = new Runner();
      const fn1 = async (ctx, next) => await next();
      const fn2 = async (ctx, next) => await next();
      runner.attach(fn1);
      runner.attach(fn2);
      runner.remove(0);
      assert.strictEqual(runner.middleware.length, 1);
      // After remove, only the second middleware remains
      assert.strictEqual(runner.middleware.length, 1);
    });

    await t.test('clear() should remove all middleware', () => {
      const runner = new Runner();
      runner.attach(async (ctx, next) => await next());
      runner.attach(async (ctx, next) => await next());
      runner.clear();
      assert.strictEqual(runner.middleware.length, 0);
    });

    await t.test('run() should execute middleware sequentially', async () => {
      const runner = new Runner();
      const order = [];

      runner.attach(async (ctx, next) => {
        order.push(1);
        await next();
        order.push(4);
      });

      runner.attach(async (ctx, next) => {
        order.push(2);
        await next();
        order.push(3);
      });

      await runner.run({});
      assert.deepStrictEqual(order, [1, 2, 3, 4]);
    });

    await t.test('run() should pass context to middleware', async () => {
      const runner = new Runner();
      let receivedCtx = null;

      runner.attach(async (ctx, next) => {
        receivedCtx = ctx;
        await next();
      });

      const ctx = { test: 'value' };
      await runner.run(ctx);
      assert.strictEqual(receivedCtx, ctx);
    });

    await t.test('run() should call finalHandler after middleware', async () => {
      const runner = new Runner();
      const order = [];

      runner.attach(async (ctx, next) => {
        order.push('middleware');
        await next();
      });

      const finalHandler = async () => {
        order.push('final');
      };

      await runner.run({}, finalHandler);
      assert.deepStrictEqual(order, ['middleware', 'final']);
    });

    await t.test('run() should throw on missing context', async () => {
      const runner = new Runner();
      await assert.rejects(async () => {
        await runner.run(null);
      }, /Context is required/);
    });

    await t.test('run() should handle errors from middleware', async () => {
      const runner = new Runner();
      const testError = new Error('test error');

      runner.attach(async (ctx, next) => {
        throw testError;
      });

      await assert.rejects(async () => {
        await runner.run({});
      }, /test error/);
    });

    await t.test('run() should update state during execution', async () => {
      const runner = new Runner();

      runner.attach(async (ctx, next) => {
        assert.strictEqual(runner.currentState, 'running');
        await next();
      });

      assert.strictEqual(runner.currentState, 'idle');
      await runner.run({});
      assert.strictEqual(runner.currentState, 'completed');
    });

    await t.test('runSync() should execute middleware synchronously', () => {
      const runner = new Runner();
      const order = [];

      runner.attach((ctx, next) => {
        order.push(1);
        next();
        order.push(4);
      });

      runner.attach((ctx, next) => {
        order.push(2);
        next();
        order.push(3);
      });

      runner.runSync({});
      assert.deepStrictEqual(order, [1, 2, 3, 4]);
    });

    await t.test('compose() should return composable function', async () => {
      const runner = new Runner();
      const order = [];

      runner.attach(async (ctx, next) => {
        order.push(1);
        await next();
        order.push(3);
      });

      runner.attach(async (ctx, next) => {
        order.push(2);
        await next();
      });

      const fn = runner.compose();
      await fn({}, async () => {});
      assert.deepStrictEqual(order, [1, 2, 3]);
    });

    await t.test('toJSON() should return runner state', () => {
      const runner = new Runner();
      runner.attach(async (ctx, next) => await next());
      const json = runner.toJSON();
      assert.strictEqual(json.state, 'idle');
      assert.strictEqual(json.middlewareCount, 1);
    });

    await t.test('Application should have runner instance', () => {
      const app = new Application();
      assert.strictEqual(typeof app.runner, 'object');
      assert.strictEqual(app.runner instanceof Runner, true);
    });

    await t.test('Application use() should attach to runner', () => {
      const app = new Application();
      const fn = async (ctx, next) => await next();
      app.use(fn);
      assert.strictEqual(app.runner.middleware.length, 1);
      assert.strictEqual(typeof app.runner.middleware[0], 'function');
    });

    await t.test('Application getRunner() should return runner', () => {
      const app = new Application();
      const runner = app.getRunner();
      assert.strictEqual(runner, app.runner);
    });

    await t.test('Application run() should use runner', async () => {
      const app = new Application();
      const order = [];

      app.use(async (ctx, next) => {
        order.push(1);
        await next();
        order.push(2);
      });

      await app.run({});
      assert.deepStrictEqual(order, [1, 2]);
    });
  });
});

console.log('Running Goa Framework tests...\n');
