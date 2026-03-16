/**
 * Runner Module
 * Synchronous middleware runner for request/response lifecycle
 */

import { validateMiddleware, isFunction, wrapSyncMiddleware, formatRunnerState } from './utils.js';
import { RUNNER_ERRORS, RUNNER_STATES, RUNNER_CONFIG } from './constants.js';

/**
 * Middleware Runner class
 * Manages middleware execution in the request/response lifecycle
 */
export default class Runner {
  constructor(options = {}) {
    this.middleware = [];
    this.state = RUNNER_STATES.IDLE;
    this.startTime = null;
    this.options = {
      ...RUNNER_CONFIG,
      ...options
    };
    this._index = -1;
  }

  /**
   * Attach middleware to the runner
   * @param {Function} fn - Middleware function
   * @returns {Runner} this
   */
  attach(fn) {
    validateMiddleware(fn);
    
    if (this.middleware.length >= this.options.maxMiddleware) {
      throw new Error(`Maximum middleware limit (${this.options.maxMiddleware}) reached`);
    }

    // Wrap sync middleware if needed
    const wrapped = wrapSyncMiddleware(fn);
    this.middleware.push(wrapped);
    return this;
  }

  /**
   * Attach multiple middleware
   * @param {...Function} fns - Middleware functions
   * @returns {Runner} this
   */
  attachAll(...fns) {
    fns.forEach(fn => this.attach(fn));
    return this;
  }

  /**
   * Remove middleware by index
   * @param {number} index
   * @returns {Runner} this
   */
  remove(index) {
    if (index >= 0 && index < this.middleware.length) {
      this.middleware.splice(index, 1);
    }
    return this;
  }

  /**
   * Clear all middleware
   * @returns {Runner} this
   */
  clear() {
    this.middleware = [];
    return this;
  }

  /**
   * Get middleware count
   * @returns {number}
   */
  get count() {
    return this.middleware.length;
  }

  /**
   * Get current state
   * @returns {string}
   */
  get currentState() {
    return this.state;
  }

  /**
   * Run middleware sequentially
   * @param {Object} ctx - Context object
   * @param {Function} [finalHandler] - Optional final handler
   * @returns {Promise}
   */
  async run(ctx, finalHandler) {
    if (!ctx) {
      throw new Error(RUNNER_ERRORS.CONTEXT_REQUIRED);
    }

    this.state = RUNNER_STATES.RUNNING;
    this.startTime = Date.now();
    this._index = -1;

    try {
      await this._dispatch(ctx, 0, finalHandler);
      this.state = RUNNER_STATES.COMPLETED;
    } catch (err) {
      this.state = RUNNER_STATES.ERROR;
      throw err;
    }

    return this;
  }

  /**
   * Dispatch middleware at index
   * @param {Object} ctx - Context
   * @param {number} i - Index
   * @param {Function} [finalHandler] - Final handler
   * @returns {Promise}
   */
  async _dispatch(ctx, i, finalHandler) {
    // Prevent next() being called multiple times
    if (i <= this._index) {
      throw new Error(RUNNER_ERRORS.NEXT_CALLED_MULTIPLE_TIMES);
    }
    this._index = i;

    // Get current middleware
    let fn = this.middleware[i];

    // If we've reached the end, use final handler
    if (i === this.middleware.length) {
      fn = finalHandler;
    }

    // If no more middleware, resolve
    if (!fn) {
      return Promise.resolve();
    }

    // Create next function
    const next = () => this._dispatch(ctx, i + 1, finalHandler);

    // Execute middleware
    try {
      const result = fn(ctx, next);
      if (result && typeof result.then === 'function') {
        return result;
      }
      return Promise.resolve(result);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Run middleware synchronously (blocking)
   * @param {Object} ctx - Context object
   * @param {Function} [finalHandler] - Optional final handler
   * @returns {Runner} this
   */
  runSync(ctx, finalHandler) {
    if (!ctx) {
      throw new Error(RUNNER_ERRORS.CONTEXT_REQUIRED);
    }

    this.state = RUNNER_STATES.RUNNING;
    this.startTime = Date.now();
    this._index = -1;

    try {
      this._dispatchSync(ctx, 0, finalHandler);
      this.state = RUNNER_STATES.COMPLETED;
    } catch (err) {
      this.state = RUNNER_STATES.ERROR;
      throw err;
    }

    return this;
  }

  /**
   * Dispatch middleware synchronously
   * @param {Object} ctx - Context
   * @param {number} i - Index
   * @param {Function} [finalHandler] - Final handler
   */
  _dispatchSync(ctx, i, finalHandler) {
    if (i <= this._index) {
      throw new Error(RUNNER_ERRORS.NEXT_CALLED_MULTIPLE_TIMES);
    }
    this._index = i;

    let fn = this.middleware[i];
    if (i === this.middleware.length) {
      fn = finalHandler;
    }
    if (!fn) return;

    const next = () => this._dispatchSync(ctx, i + 1, finalHandler);
    fn(ctx, next);
  }

  /**
   * Create a composed function from middleware
   * @returns {Function}
   */
  compose() {
    const middleware = [...this.middleware];
    
    return async (ctx, next) => {
      let index = -1;

      const dispatch = async (i) => {
        if (i <= index) {
          throw new Error(RUNNER_ERRORS.NEXT_CALLED_MULTIPLE_TIMES);
        }
        index = i;

        let fn = middleware[i];
        if (i === middleware.length) fn = next;
        if (!fn) return;

        return fn(ctx, () => dispatch(i + 1));
      };

      return dispatch(0);
    };
  }

  /**
   * Get runner state info
   * @returns {Object}
   */
  toJSON() {
    return formatRunnerState(this);
  }

  /**
   * Inspect implementation
   * @returns {Object}
   */
  inspect() {
    return this.toJSON();
  }
}

// Named exports
export { Runner };
