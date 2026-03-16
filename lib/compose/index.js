/**
 * Compose Module
 * Compose middleware into a single function for execution
 */

import { validateMiddleware, getMiddlewareAt, isValidIndex } from './utils.js';
import { COMPOSE_ERRORS } from './constants.js';

/**
 * Compose middleware into a single function.
 * @param {Array} middleware - Array of middleware functions
 * @returns {Function} Composed middleware function
 */
export function compose(middleware) {
  // Validate middleware input
  validateMiddleware(middleware);

  return function composedMiddleware(context, next) {
    let index = -1;
    return dispatch(0);

    /**
     * Dispatch middleware at index
     * @param {number} i - Middleware index
     * @returns {Promise}
     */
    function dispatch(i) {
      // Prevent next() being called multiple times
      if (i <= index) {
        return Promise.reject(new Error(COMPOSE_ERRORS.NEXT_CALLED_MULTIPLE_TIMES));
      }
      index = i;

      // Get current middleware function
      let fn = getMiddlewareAt(middleware, i);
      
      // If we've reached the end, use the provided next function
      if (i === middleware.length) {
        fn = next;
      }
      
      // If no more middleware, resolve
      if (!fn) {
        return Promise.resolve();
      }

      // Execute middleware and return promise
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}

/**
 * Compose middleware synchronously (for advanced use cases)
 * @param {Array} middleware
 * @returns {Function}
 */
export function composeSync(middleware) {
  validateMiddleware(middleware);

  return function composedSyncMiddleware(context, next) {
    let index = -1;

    function dispatch(i) {
      if (i <= index) {
        throw new Error(COMPOSE_ERRORS.NEXT_CALLED_MULTIPLE_TIMES);
      }
      index = i;

      let fn = getMiddlewareAt(middleware, i);
      if (i === middleware.length) fn = next;
      if (!fn) return;

      return fn(context, dispatch.bind(null, i + 1));
    }

    return dispatch(0);
  };
}

/**
 * Create a middleware chain with logging
 * @param {Array} middleware
 * @param {Object} options
 * @returns {Function}
 */
export function composeWithLogging(middleware, options = {}) {
  const { log = console.log } = options;
  
  validateMiddleware(middleware);

  return function loggedMiddleware(context, next) {
    let index = -1;

    function dispatch(i) {
      if (i <= index) {
        return Promise.reject(new Error(COMPOSE_ERRORS.NEXT_CALLED_MULTIPLE_TIMES));
      }
      index = i;

      const fn = i === middleware.length ? next : getMiddlewareAt(middleware, i);
      
      if (!fn) {
        return Promise.resolve();
      }

      log(`[Compose] Executing middleware ${i}${fn.name ? `: ${fn.name}` : ''}`);

      try {
        const result = fn(context, dispatch.bind(null, i + 1));
        
        return Promise.resolve(result).then(
          value => {
            log(`[Compose] Completed middleware ${i}`);
            return value;
          },
          err => {
            log(`[Compose] Error in middleware ${i}: ${err.message}`);
            throw err;
          }
        );
      } catch (err) {
        log(`[Compose] Error in middleware ${i}: ${err.message}`);
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
}

export default compose;
