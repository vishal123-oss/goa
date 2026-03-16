/**
 * Goa Framework - Basic Example
 * Run with: npm start or node examples/basic.js
 */

import Goa, { Runner } from '../index.js';

const app = new Goa();

// Demonstrate Runner usage - middleware runner for request/response cycle
const runner = app.getRunner();

// You can also create standalone runners
const standaloneRunner = new Runner();

// Attach middleware to standalone runner
standaloneRunner.attach(async (ctx, next) => {
  console.log('[Runner] Before handler');
  await next();
  console.log('[Runner] After handler');
});

// Run runner independently
// standaloneRunner.run({}).then(() => console.log('Runner completed'));

// Logger middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// Response time header
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// Main route handler
app.use(async (ctx) => {
  // Simple routing example
  if (ctx.path === '/') {
    // HTML is inferred from string content
    ctx.body = `
      <!DOCTYPE html>
      <html>
        <head><title>Goa Framework</title></head>
        <body>
          <h1>Welcome to Goa!</h1>
          <p>A minimal, expressive HTTP middleware framework</p>
          <ul>
            <li><a href="/json">JSON Response</a></li>
            <li><a href="/text">Text Response</a></li>
            <li><a href="/html">HTML Response</a></li>
          </ul>
        </body>
      </html>
    `;
  } else if (ctx.path === '/json') {
    // Objects are JSON stringified automatically
    ctx.body = {
      message: 'Hello from Goa!',
      framework: 'koa-inspired',
      version: '1.0.0'
    };
  } else if (ctx.path === '/text') {
    // Plain strings are sent as text/plain
    ctx.body = 'Hello, this is a plain text response!';
  } else if (ctx.path === '/html') {
    // HTML is inferred from string content
    ctx.body = '<h1>HTML Response</h1><p>Rendered with proper content-type</p>';
  } else {
    ctx.status = 404;
    ctx.body = { error: 'Not Found' };
  }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Goa server running on http://localhost:${PORT}`);
  console.log('   Try these endpoints:');
  console.log('   - /       (HTML homepage)');
  console.log('   - /json   (JSON response)');
  console.log('   - /text   (Plain text)');
  console.log('   - /html   (HTML content)\n');
});
