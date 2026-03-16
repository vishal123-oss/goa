/**
 * Runner Module Utilities
 * Utilities specific to middleware runner
 */

import { RUNNER_ERRORS } from './constants.js';

/**
 * Validate middleware function
 * @param {Function} fn
 * @throws {TypeError}
 */
export function validateMiddleware(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError(RUNNER_ERRORS.INVALID_MIDDLEWARE);
  }
}

/**
 * Validate array of middleware
 * @param {Array} middleware
 * @throws {TypeError}
 */
export function validateMiddlewareArray(middleware) {
  if (!Array.isArray(middleware)) {
    throw new TypeError('Middleware must be an array');
  }
  middleware.forEach(validateMiddleware);
}

/**
 * Check if value is a function
 * @param {any} val
 * @returns {boolean}
 */
export function isFunction(val) {
  return typeof val === 'function';
}

/**
 * Check if value is an async function
 * @param {any} val
 * @returns {boolean}
 */
export function isAsyncFunction(val) {
  return val && val.constructor && val.constructor.name === 'AsyncFunction';
}

/**
 * Create a unique middleware ID
 * @returns {string}
 */
export function createMiddlewareId() {
  return `mw_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Wrap synchronous middleware to return Promise
 * @param {Function} fn
 * @returns {Function}
 */
export function wrapSyncMiddleware(fn) {
  return async (ctx, next) => {
    const result = fn(ctx, next);
    if (result && typeof result.then === 'function') {
      return result;
    }
    return result;
  };
}

/**
 * Create error with runner context
 * @param {string} message
 * @param {Object} context
 * @returns {Error}
 */
export function createRunnerError(message, context = {}) {
  const err = new Error(message);
  err.code = 'RUNNER_ERROR';
  err.context = context;
  return err;
}

/**
 * Format runner state for debugging
 * @param {Object} runner
 * @returns {Object}
 */
export function formatRunnerState(runner) {
  return {
    state: runner.state,
    middlewareCount: runner.middleware?.length || 0,
    startTime: runner.startTime,
    elapsed: runner.startTime ? Date.now() - runner.startTime : 0
  };
}
