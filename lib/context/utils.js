/**
 * Context Module Utilities
 * Utilities specific to context handling
 */

import {
  createAcceptsChecker,
  getClientIp as sharedGetClientIp,
  getClientIps as sharedGetClientIps,
  extractSubdomains,
  createHttpError,
  isObject
} from '../shared/utils.js';

import { CONTEXT_CONFIG } from './constants.js';

/**
 * Create default context state
 * @returns {Object}
 */
export function createContextState() {
  return {};
}

/**
 * Validate context has request/response
 * @param {Object} ctx
 */
export function isContextValid(ctx) {
  return !!(ctx && ctx.req && ctx.res);
}

/**
 * Initialize context with native req/res/app
 * @param {Object} ctx
 * @param {Object} req
 * @param {Object} res
 * @param {Object} app
 */
export function initializeContext(ctx, req, res, app) {
  ctx.req = req;
  ctx.res = res;
  ctx.app = app;
  ctx.request = ctx.request || null;
  ctx.response = ctx.response || null;
  ctx.state = createContextState();
  ctx.respond = CONTEXT_CONFIG.respond;
  ctx._accept = null;
  ctx._startTime = Date.now();
  ctx._responded = false;
  ctx._cookies = {};
  ctx._session = null;
}

/**
 * Get header value from request
 * @param {Object} ctx
 * @param {string} field
 * @returns {string}
 */
export function getHeader(ctx, field) {
  const key = field.toLowerCase();
  return ctx.req?.headers?.[key] || '';
}

/**
 * Set header on response
 * @param {Object} ctx
 * @param {string} field
 * @param {string} value
 */
export function setHeader(ctx, field, value) {
  if (ctx.res?.headersSent) return;
  ctx.res?.setHeader?.(field, value);
}

/**
 * Append header on response
 * @param {Object} ctx
 * @param {string} field
 * @param {string|string[]} value
 */
export function appendHeader(ctx, field, value) {
  if (ctx.res?.headersSent) return;
  const headers = ctx.res?.getHeaders?.() || {};
  const key = field.toLowerCase();
  const prev = headers[key];
  let next = value;

  if (prev) {
    next = Array.isArray(prev) ? prev.concat(value) : [prev].concat(value);
  }

  ctx.res?.setHeader?.(field, next);
}

/**
 * Remove header from response
 * @param {Object} ctx
 * @param {string} field
 */
export function removeHeader(ctx, field) {
  if (ctx.res?.headersSent) return;
  ctx.res?.removeHeader?.(field);
}

/**
 * Accepts helper
 * @param {Object} ctx
 * @param {...string} args
 * @returns {string|false|Array}
 */
export function accepts(ctx, ...args) {
  return createContextAccepts(ctx).types(...args);
}

/**
 * Create accept checker for context
 * @param {Object} ctx
 * @returns {Object}
 */
export function createContextAccepts(ctx) {
  const accept = ctx.req?.headers?.accept || '';
  return createAcceptsChecker(accept);
}

/**
 * Get client IP
 * @param {Object} ctx
 * @returns {string}
 */
export function getClientIp(ctx) {
  return sharedGetClientIp(ctx.request?.socket, ctx.req?.headers || {}, ctx.app?.proxy, ctx.app?.proxyIpHeader);
}

/**
 * Get client IPs
 * @param {Object} ctx
 * @returns {string[]}
 */
export function getClientIps(ctx) {
  return sharedGetClientIps(ctx.req?.headers || {}, ctx.app?.proxy, ctx.app?.proxyIpHeader);
}

/**
 * Get subdomains
 * @param {Object} ctx
 * @returns {string[]}
 */
export function getSubdomains(ctx) {
  return extractSubdomains(ctx.request?.hostname, ctx.app?.subdomainOffset || 2);
}

/**
 * Get cookie value
 * @param {Object} ctx
 * @param {string} name
 * @returns {string|undefined}
 */
export function getCookie(ctx, name) {
  return ctx.request?.cookie?.(name);
}

/**
 * Set cookie
 * @param {Object} ctx
 * @param {string} name
 * @param {string} value
 * @param {Object} options
 */
export function setCookie(ctx, name, value, options) {
  ctx.response?.cookie?.(name, value, options);
}

/**
 * Clear cookie
 * @param {Object} ctx
 * @param {string} name
 * @param {Object} options
 */
export function clearCookie(ctx, name, options) {
  ctx.response?.clearCookie?.(name, options);
}

/**
 * Get all cookies
 * @param {Object} ctx
 * @returns {Object}
 */
export function getCookies(ctx) {
  return ctx.request?.cookies || {};
}

/**
 * Get request start time
 * @param {Object} ctx
 * @returns {number}
 */
export function getStartTime(ctx) {
  return ctx._startTime;
}

/**
 * Get elapsed time
 * @param {Object} ctx
 * @returns {number}
 */
export function getElapsedTime(ctx) {
  return Date.now() - (ctx._startTime || Date.now());
}

/**
 * Check if response has been sent
 * @param {Object} ctx
 * @returns {boolean}
 */
export function hasResponded(ctx) {
  return !!ctx._responded;
}

/**
 * Mark context as responded
 * @param {Object} ctx
 */
export function markResponded(ctx) {
  ctx._responded = true;
}

/**
 * Get session data
 * @param {Object} ctx
 * @returns {Object|null}
 */
export function getSession(ctx) {
  return ctx._session || null;
}

/**
 * Set session data
 * @param {Object} ctx
 * @param {Object} val
 */
export function setSession(ctx, val) {
  ctx._session = val;
}

/**
 * Redirect helper
 * @param {Object} ctx
 * @param {string} url
 * @param {string} [alt]
 */
export function redirect(ctx, url, alt) {
  ctx.response?.redirect?.(url, alt);
}

/**
 * Attachment helper
 * @param {Object} ctx
 * @param {string} filename
 * @param {Object} options
 */
export function attachment(ctx, filename, options) {
  ctx.response?.attachment?.(filename, options);
}

/**
 * Vary response header
 * @param {Object} ctx
 * @param {string} field
 */
export function varyHeader(ctx, field) {
  ctx.response?.vary?.(field);
}

/**
 * Throw http error
 * @param {number} status
 * @param {string} msg
 * @param {Object} props
 */
export function throwError(status, msg, props) {
  if (isObject(msg)) {
    props = msg;
    msg = '';
  }
  throw createHttpError(status, msg, props);
}

/**
 * Assert condition
 * @param {any} value
 * @param {number} status
 * @param {string} msg
 * @param {Object} props
 */
export function assertCondition(value, status, msg, props) {
  if (!value) {
    throwError(status, msg, props);
  }
}

/**
 * Convert context to JSON
 * @param {Object} ctx
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
 * Inspect context
 * @param {Object} ctx
 * @returns {Object}
 */
export function inspectContext(ctx) {
  return contextToJSON(ctx);
}
