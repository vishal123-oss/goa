import http from 'http';
import util from 'util';
import Request from './request.js';
import Response from './response.js';
import Context from './context.js';
import { compose } from './compose.js';

/**
 * Application class for Goa framework.
 * The main entry point for creating a web server.
 */
export default class Application {
  constructor(options = {}) {
    this.middleware = [];
    this.subdomainOffset = options.subdomainOffset || 2;
    this.proxy = options.proxy || false;
    this.proxyIpHeader = options.proxyIpHeader || 'X-Forwarded-For';
    this.maxIpsCount = options.maxIpsCount || 0;
    this.env = options.env || process.env.NODE_ENV || 'development';
    this.keys = options.keys;
    this.silent = options.silent || false;
    
    // Create a context prototype for each app instance
    this.context = Object.create(Context.prototype);
    this.request = Object.create(Request.prototype);
    this.response = Object.create(Response.prototype);
  }

  /**
   * Use the given middleware function.
   * @param {Function} fn - Middleware function
   * @returns {Application} this
   */
  use(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('middleware must be a function!');
    }
    if (util.isAsyncFunction && !util.isAsyncFunction(fn) && fn.length < 2) {
      // Could add deprecation warning for non-async middleware
    }
    this.middleware.push(fn);
    return this;
  }

  /**
   * Start the server.
   * @param {number} [port] - Port to listen on
   * @param {string} [host] - Host to listen on
   * @param {Function} [callback] - Callback when server starts
   * @returns {http.Server}
   */
  listen(port, host, callback) {
    const server = http.createServer(this.callback());
    return server.listen(port, host, callback);
  }

  /**
   * Return a request handler callback for node's native http server.
   * @returns {Function}
   */
  callback() {
    const fn = compose(this.middleware);

    if (!this.listenerCount || !this.listenerCount('error')) {
      // Add default error handler
    }

    const handleRequest = (req, res) => {
      const ctx = this.createContext(req, res);
      return this.handleRequest(ctx, fn);
    };

    return handleRequest;
  }

  /**
   * Handle request.
   * @param {Context} ctx
   * @param {Function} fnMiddleware
   * @returns {Promise}
   */
  handleRequest(ctx, fnMiddleware) {
    const res = ctx.res;
    res.statusCode = 404;
    const onerror = err => this.onerror(err, ctx);
    const handleResponse = () => respond(ctx);
    return fnMiddleware(ctx).then(handleResponse).catch(onerror);
  }

  /**
   * Create a new context for the request.
   * @param {Object} req - Node request
   * @param {Object} res - Node response
   * @returns {Context}
   */
  createContext(req, res) {
    const context = Object.create(this.context);
    const request = context.request = Object.create(this.request);
    const response = context.response = Object.create(this.response);

    context.app = request.app = response.app = this;
    context.req = request.req = response.req = req;
    context.res = request.res = response.res = res;
    request.ctx = response.ctx = context;
    request.response = response;
    response.request = request;

    context.state = {};
    context.respond = true;

    return context;
  }

  /**
   * Default error handler.
   * @param {Error} err
   * @param {Context} ctx
   */
  onerror(err, ctx) {
    if (err instanceof Error === false) {
      throw new TypeError(util.format('non-error thrown: %j', err));
    }

    if (404 === err.status || err.expose) return;
    if (this.silent) return;

    const msg = err.stack || err.toString();
    console.error(`\n${msg.replace(/^/gm, '  ')}\n`);
  }

  /**
   * Return JSON representation.
   * @returns {Object}
   */
  toJSON() {
    return {
      subdomainOffset: this.subdomainOffset,
      proxy: this.proxy,
      env: this.env
    };
  }

  /**
   * Inspect implementation.
   * @returns {Object}
   */
  [util.inspect.custom]() {
    return this.toJSON();
  }

  /**
   * Get the number of listeners for an event (for checking error listeners).
   * @param {string} event
   * @returns {number}
   */
  listenerCount(event) {
    return 0; // Simplified - would need EventEmitter inheritance
  }
}

/**
 * Response helper.
 * @param {Context} ctx
 */
function respond(ctx) {
  // Allow bypassing response handling
  if (ctx.respond === false) return;

  if (!ctx.writable) return;

  const res = ctx.res;
  let body = ctx.body;
  const code = ctx.status;

  // Empty status codes (no body)
  const empty = {
    204: true,
    205: true,
    304: true
  };

  // Ignore body for 204, 205, 304
  if (empty[code]) {
    body = null;
    return res.end();
  }

  // Status body
  if (null == body) {
    if (ctx.req.httpVersionMajor >= 2) {
      body = String(code);
    } else {
      body = ctx.message || String(code);
    }
    if (!res.headersSent) {
      ctx.type = 'text';
      ctx.length = Buffer.byteLength(body);
    }
    return res.end(body);
  }

  // Check if stream (simple check)
  if (body && typeof body.pipe === 'function') {
    return body.pipe(res);
  }

  // Responses
  if (Buffer.isBuffer(body)) return res.end(body);
  if ('string' === typeof body) return res.end(body);

  // body: json
  body = JSON.stringify(body);
  if (!res.headersSent) {
    ctx.length = Buffer.byteLength(body);
  }
  res.end(body);
}
