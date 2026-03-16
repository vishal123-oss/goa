/**
 * Compose Module Utilities
 * Utilities specific to middleware composition
 */

import { isFunction } from '../shared/utils.js';

/**
 * Validate middleware array
 * @param {Array} middleware
 * @throws {TypeError}
 */
export function validateMiddleware(middleware) {
  if (!Array.isArray(middleware)) {
    throw new TypeError('Middleware stack must be an array!');
  }

  for (const fn of middleware) {
    if (!isFunction(fn)) {
      throw new TypeError('Middleware must be composed of functions!');
    }
  }
}

/**
 * Check if middleware is valid
 * @param {any} middleware
 * @returns {boolean}
 */
export function isValidMiddleware(middleware) {
  return Array.isArray(middleware) && middleware.every(isFunction);
}

/**
 * Get middleware length safely
 * @param {Array} middleware
 * @returns {number}
 */
export function getMiddlewareLength(middleware) {
  return Array.isArray(middleware) ? middleware.length : 0;
}

/**
 * Check if index is within middleware bounds
 * @param {number} index
 * @param {Array} middleware
 * @returns {boolean}
 */
export function isValidIndex(index, middleware) {
  return index >= 0 && index <= middleware.length;
}

/**
 * Get middleware at index
 * @param {Array} middleware
 * @param {number} index
 * @returns {Function|undefined}
 */
export function getMiddlewareAt(middleware, index) {
  if (!Array.isArray(middleware)) return undefined;
  return middleware[index];
}
