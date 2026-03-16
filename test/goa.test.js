/**
 * Goa Framework Tests
 * Basic test suite for the framework
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';

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
        'host': 'localhost:3000',
        'content-type': 'application/json',
        'x-requested-with': 'XMLHttpRequest'
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
  });

  await t.test('Response class should work', () => {
    const mockReq = {};
    const mockRes = {
      statusCode: 200,
      getHeaders: () => ({}),
      setHeader: (key, val) => {},
      removeHeader: (key) => {},
      headersSent: false
    };

    const response = new Response(mockReq, mockRes);
    response.status = 200;
    assert.strictEqual(response.status, 200);
  });

  await t.test('Context class should work', () => {
    const ctx = new Context();
    // State and respond are set by app.createContext, not constructor
    assert.ok(ctx !== null);
    assert.strictEqual(ctx.app, null);
  });
});

test('Goa HTTP Integration', async (t) => {
  await t.test('should start server and respond', async () => {
    const app = new Application();
    
    app.use(async (ctx) => {
      ctx.body = { message: 'Hello Goa!' };
    });

    const server = app.listen(0);
    
    await new Promise((resolve) => {
      server.once('listening', () => {
        const port = server.address().port;
        
        http.get(`http://localhost:${port}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            const json = JSON.parse(data);
            assert.strictEqual(json.message, 'Hello Goa!');
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
});

console.log('Running Goa Framework tests...\n');
