/**
 * Application Module Utilities
 * Utilities specific to application/core handling
 */

import { isFunction, isObject, merge, isStream } from '../shared/utils.js';
import { STATUS_CODES_WITHOUT_BODY } from '../shared/constants.js';

/**
 * Validate middleware function
 * @param {Function} fn
 * @throws {TypeError}
 */
export function validateMiddleware(fn) {
  if (!isFunction(fn)) {
    throw new TypeError('middleware must be a function!');
  }
}

/**
 * Check if value is valid middleware
 * @param {any} fn
 * @returns {boolean}
 */
export function isValidMiddleware(fn) {
  return isFunction(fn);
}

/**
 * Merge application options with defaults
 * @param {Object} options
 * @param {Object} defaults
 * @returns {Object}
 */
export function mergeOptions(options, defaults) {
  return merge({}, defaults, options);
}

/**
 * Get environment from options or process
 * @param {Object} options
 * @returns {string}
 */
export function getEnvironment(options) {
  return options.env || process.env.NODE_ENV || 'development';
}

/**
 * Create application prototype chain
 * @param {Function} ContextClass
 * @param {Function} RequestClass
 * @param {Function} ResponseClass
 * @returns {Object}
 */
export function createPrototypes(ContextClass, RequestClass, ResponseClass) {
  return {
    context: Object.create(ContextClass.prototype),
    request: Object.create(RequestClass.prototype),
    response: Object.create(ResponseClass.prototype)
  };
}

/**
 * Create context for request
 * @param {Object} app
 * @param {Object} req
 * @param {Object} res
 * @returns {Object}
 */
export function createContext(app, req, res) {
  const context = Object.create(app.context);
  const request = context.request = Object.create(app.request);
  const response = context.response = Object.create(app.response);

  context.app = request.app = response.app = app;
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
 * Handle response based on context
 * @param {Object} ctx
 */
export function respond(ctx) {
  // Allow bypassing response handling
  if (ctx.respond === false) return;
  if (!ctx.writable) return;

  const res = ctx.res;
  let body = ctx.body;
  const code = ctx.status;

  // Ignore body for 204, 205, 304
  if (STATUS_CODES_WITHOUT_BODY[code]) {
    body = null;
    return res.end();
  }

  // Status body
  if (body == null) {
    body = ctx.message || String(code);
    if (!res.headersSent) {
      ctx.type = 'text';
      ctx.length = Buffer.byteLength(body);
    }
    return res.end(body);
  }

  // Check if stream
  if (isStream(body)) {
    return body.pipe(res);
  }

  // Buffer or string
  if (Buffer.isBuffer(body) || typeof body === 'string') {
    return res.end(body);
  }

  // JSON
  body = JSON.stringify(body);
  if (!res.headersSent) {
    ctx.length = Buffer.byteLength(body);
  }
  res.end(body);
}

/**
 * Default error handler
 * @param {Error} err
 * @param {Object} ctx
 * @param {boolean} silent
 */
export function handleError(err, ctx, silent) {
  if (err instanceof Error === false) {
    throw new TypeError(`non-error thrown: ${err}`);
  }

  if (404 === err.status || err.expose) return;
  if (silent) return;

  const msg = err.stack || err.toString();
  console.error(`\n${msg.replace(/^/gm, '  ')}\n`);
}

/**
 * Convert application to JSON representation
 * @param {Object} app
 * @returns {Object}
 */
export function appToJSON(app) {
  return {
    subdomainOffset: app.subdomainOffset,
    proxy: app.proxy,
    env: app.env,
    middlewareCount: app.middleware?.length || 0
  };
}

/**
 * Inspect application for debugging
 * @param {Object} app
 * @returns {Object}
 */
export function inspectApp(app) {
  return {
    subdomainOffset: app.subdomainOffset,
    proxy: app.proxy,
    env: app.env,
    middleware: app.middleware,
    keys: app.keys ? '[secure]' : undefined
  };
}
