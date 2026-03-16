/**
 * Context Module Utilities
 * Utilities specific to context handling
 */

import { isFunction, isObject, isString, createHttpError, createAcceptsChecker } from '../shared/utils.js';

/**
 * Create context state object
 * @returns {Object}
 */
export function createContextState() {
  return {};
}

/**
 * Check if context is properly initialized
 * @param {Context} ctx
 * @returns {boolean}
 */
export function isContextValid(ctx) {
  return ctx && 
         isObject(ctx.request) && 
         isObject(ctx.response) && 
         isObject(ctx.req) && 
         isObject(ctx.res);
}

/**
 * Get header from request through context
 * @param {Context} ctx
 * @param {string} field
 * @returns {string}
 */
export function getHeader(ctx, field) {
  return ctx.request.get(field);
}

/**
 * Set header on response through context
 * @param {Context} ctx
 * @param {string} field
 * @param {string} value
 */
export function setHeader(ctx, field, value) {
  ctx.response.set(field, value);
}

/**
 * Append header on response through context
 * @param {Context} ctx
 * @param {string} field
 * @param {string} value
 */
export function appendHeader(ctx, field, value) {
  ctx.response.append(field, value);
}

/**
 * Remove header from response through context
 * @param {Context} ctx
 * @param {string} field
 */
export function removeHeader(ctx, field) {
  ctx.response.remove(field);
}

/**
 * Check if request accepts given content type(s)
 * @param {Context} ctx
 * @param {...string} types
 * @returns {string|false}
 */
export function accepts(ctx, ...types) {
  return ctx.accept.types(...types);
}

/**
 * Create accepts checker for context
 * @param {Context} ctx
 * @returns {Object}
 */
export function createContextAccepts(ctx) {
  const acceptHeader = ctx.request.accept;
  return createAcceptsChecker(acceptHeader);
}

/**
 * Get client IP from context
 * @param {Context} ctx
 * @returns {string}
 */
export function getClientIp(ctx) {
  const app = ctx.app;
  const socket = ctx.request.socket;
  const headers = ctx.request.headers;
  
  if (app?.proxy) {
    const val = headers['x-forwarded-for'];
    if (val) {
      return val.split(/\s*,\s*/)[0];
    }
  }
  return socket?.remoteAddress || '';
}

/**
 * Get client IPs array from context
 * @param {Context} ctx
 * @returns {string[]}
 */
export function getClientIps(ctx) {
  const app = ctx.app;
  if (!app?.proxy) return [];
  const val = ctx.request.headers['x-forwarded-for'];
  return val ? val.split(/\s*,\s*/) : [];
}

/**
 * Get subdomains from context
 * @param {Context} ctx
 * @returns {string[]}
 */
export function getSubdomains(ctx) {
  const hostname = ctx.hostname;
  if (!hostname) return [];
  const offset = ctx.app?.subdomainOffset || 2;
  return hostname.split('.').reverse().slice(offset);
}

/**
 * Redirect response
 * @param {Context} ctx
 * @param {string} url
 * @param {string} [alt]
 */
export function redirect(ctx, url, alt) {
  ctx.response.redirect(url, alt);
}

/**
 * Set attachment disposition
 * @param {Context} ctx
 * @param {string} filename
 * @param {Object} options
 */
export function attachment(ctx, filename, options) {
  ctx.response.attachment(filename, options);
}

/**
 * Vary response header
 * @param {Context} ctx
 * @param {string} field
 */
export function varyHeader(ctx, field) {
  ctx.response.vary(field);
}

/**
 * Throw HTTP error
 * @param {number} status
 * @param {string} msg
 * @param {Object} props
 * @throws {Error}
 */
export function throwError(status, msg, props) {
  if (isObject(msg)) {
    props = msg;
    msg = '';
  }
  throw createHttpError(status, msg, props);
}

/**
 * Assert condition, throw if false
 * @param {any} value
 * @param {number} status
 * @param {string} msg
 * @param {Object} props
 * @throws {Error}
 */
export function assertCondition(value, status, msg, props) {
  if (!value) {
    throwError(status, msg, props);
  }
}

/**
 * Convert context to JSON representation
 * @param {Context} ctx
 * @returns {Object}
 */
export function contextToJSON(ctx) {
  return {
    request: ctx.request?.toJSON ? ctx.request.toJSON() : ctx.request,
    response: ctx.response?.toJSON ? ctx.response.toJSON() : ctx.response,
    app: ctx.app?.toJSON ? ctx.app.toJSON() : ctx.app,
    state: ctx.state
  };
}

/**
 * Inspect context for debugging
 * @param {Context} ctx
 * @returns {Object}
 */
export function inspectContext(ctx) {
  return {
    request: ctx.request,
    response: ctx.response,
    app: ctx.app,
    state: ctx.state,
    url: ctx.url,
    method: ctx.method,
    status: ctx.status,
    body: ctx.body
  };
}
