# Goa Framework

[![npm version](https://img.shields.io/npm/v/goa.svg)](https://www.npmjs.com/package/goa)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/goa.svg)](https://nodejs.org)

A minimal, expressive HTTP middleware framework for Node.js — inspired by Koa.

## Features

- 🪶 **Lightweight** — Minimal core, no dependencies
- 🔌 **Middleware-driven** — Composable async middleware stack
- 🌐 **ES Modules** — Native ESM support with CJS fallback
- 🎯 **Koa-compatible API** — Familiar for Koa developers
- 📦 **Tree-shakeable** — Import only what you need

## Installation

```bash
npm install goa
```

## Quick Start

```javascript
import Goa from 'goa';

const app = new Goa();

app.use(async (ctx, next) => {
  await next();
  ctx.set('X-Response-Time', `${Date.now() - ctx.startTime}ms`);
});

app.use(async (ctx) => {
  ctx.startTime = Date.now();
  ctx.body = { message: 'Hello from Goa!' };
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## Core Concepts

### Application

The `Application` is the main entry point. It wraps Node's `http.Server` and manages the middleware stack.

```javascript
import { Application } from 'goa';

const app = new Application({
  proxy: true,           // Trust proxy headers
  subdomainOffset: 2,    // Subdomain offset
  env: 'production'      // Environment
});

app.listen(3000);
```

### Middleware

Middleware are async functions with access to `ctx` (context) and `next`:

```javascript
app.use(async (ctx, next) => {
  // Before downstream
  console.log('Request:', ctx.method, ctx.url);
  
  await next(); // Call next middleware
  
  // After downstream
  console.log('Response:', ctx.status);
});
```

### Context

`ctx` encapsulates `request` and `response` objects:

| Property | Description |
|----------|-------------|
| `ctx.req` | Node's `IncomingMessage` |
| `ctx.res` | Node's `ServerResponse` |
| `ctx.request` | Enhanced Request object |
| `ctx.response` | Enhanced Response object |
| `ctx.state` | Namespace for passing data |
| `ctx.body` | Response body (string, Buffer, Object, Stream) |
| `ctx.status` | HTTP status code |
| `ctx.method` | Request method |
| `ctx.url` / `ctx.path` | Request URL/path |
| `ctx.query` | Parsed query string |
| `ctx.headers` | Request headers |
| `ctx.ip` | Client IP address |

### Request & Response

Full request/response abstractions with convenient getters/setters:

```javascript
app.use(async (ctx) => {
  // Request
  const type = ctx.request.type;        // Content-Type without charset
  const fresh = ctx.request.fresh;      // Cache freshness check
  const xhr = ctx.request.xhr;          // XMLHttpRequest?
  
  // Response
  ctx.response.set('X-Custom', 'value');
  ctx.response.vary('Accept');
  ctx.response.redirect('/new-url');
});
```

## API Reference

### Application

- `app.use(fn)` — Add middleware (returns `this` for chaining)
- `app.listen(port, [host], [callback])` — Start HTTP server
- `app.callback()` — Return request handler for `http.createServer`
- `app.onerror(err)` — Default error handler

### compose(middleware)

Compose an array of middleware into a single function:

```javascript
import { compose } from 'goa';

const fn = compose([mw1, mw2, mw3]);
await fn(ctx);
```

## Project Structure

```
goa/
├── index.js              # Main entry point
├── package.json          # Package config (ESM)
├── lib/
│   ├── application.js    # Application class
│   ├── context.js        # Context class
│   ├── request.js        # Request abstraction
│   ├── response.js       # Response abstraction
│   └── compose.js        # Middleware composer
├── test/
│   └── goa.test.js       # Test suite
├── examples/
│   └── basic.js          # Example app
├── scripts/
│   └── build-cjs.js      # CJS build script
└── dist/                 # Built output
```

## Scripts

```bash
# Run example app
npm start

# Development with watch mode
npm run dev

# Run tests
npm test

# Watch mode tests
npm run test:watch

# Build (ESM + CJS)
npm run build
```

## License

MIT
