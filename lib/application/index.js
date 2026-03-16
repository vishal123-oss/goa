import http from 'http';
import util from 'util';

import Request from '../request/index.js';
import Response from '../response/index.js';
import Context from '../context/index.js';
import { compose } from '../compose/index.js';
import Runner from '../runner/index.js';

import {
  validateMiddleware,
  mergeOptions,
  getEnvironment,
  createPrototypes,
  createContext,
  respond,
  handleError,
  appToJSON
} from './utils.js';

import { DEFAULT_APP_OPTIONS, APP_EVENTS, APP_ERRORS } from './constants.js';

/**
 * Application class for Goa framework.
 * The main entry point for creating a web server.
 */
export default class Application {
  constructor(options = {}) {
    const opts = mergeOptions(options, DEFAULT_APP_OPTIONS);

    this.middleware = [];
    this.subdomainOffset = opts.subdomainOffset;
    this.proxy = opts.proxy;
    this.proxyIpHeader = opts.proxyIpHeader;
    this.maxIpsCount = opts.maxIpsCount;
    this.env = getEnvironment(opts);
    this.keys = opts.keys;
    this.silent = opts.silent;

    // Create synchronous middleware runner
    this.runner = new Runner({
      maxMiddleware: opts.maxMiddleware || 100
    });

    // Create prototypes
    const protos = createPrototypes(Context, Request, Response);
    this.context = protos.context;
    this.request = protos.request;
    this.response = protos.response;
  }

  /**
   * Use the given middleware function.
   * @param {Function} fn - Middleware function
   * @returns {Application} this
   */
  use(fn) {
    validateMiddleware(fn);
    this.middleware.push(fn);
    // Also attach to runner for sequential execution
    this.runner.attach(fn);
    return this;
  }

  /**
   * Get the runner instance for middleware management.
   * @returns {Runner}
   */
  getRunner() {
    return this.runner;
  }

  /**
   * Run middleware synchronously using the runner.
   * @param {Object} ctx - Context object
   * @param {Function} [finalHandler] - Optional final handler
   * @returns {Promise}
   */
  async run(ctx, finalHandler) {
    return this.runner.run(ctx, finalHandler);
  }

  /**
   * Create a route middleware for a specific method and path.
   * @param {string} method - HTTP method
   * @param {string} path - Request path (supports :param syntax)
   * @param {Function} fn - Handler function
   * @returns {Function} Middleware function
   */
  _createRoute(method, path, fn) {
    validateMiddleware(fn);

    // Check if path has parameters
    const hasParams = path.includes(':');
    let paramNames = [];
    let regex = null;

    if (hasParams) {
      paramNames = (path.match(/:(\w+)/g) || []).map(p => p.slice(1));
      const regexPattern = '^' + path.replace(/:(\w+)/g, '([^/]+)') + '$';
      regex = new RegExp(regexPattern);
    }

    return async (ctx, next) => {
      // Check method
      if (ctx.method !== method) {
        return next();
      }

      // Exact match
      if (!hasParams && ctx.path === path) {
        return fn(ctx, next);
      }

      // Regex match with params
      if (hasParams && regex) {
        const match = ctx.path.match(regex);
        if (match) {
          // Extract params
          ctx.params = {};
          paramNames.forEach((name, index) => {
            ctx.params[name] = match[index + 1];
          });
          return fn(ctx, next);
        }
      }

      return next();
    };
  }

  /**
   * Register a GET route.
   * @param {string} path - Request path
   * @param {Function} fn - Handler function
   * @returns {Application} this
   */
  get(path, fn) {
    const route = this._createRoute('GET', path, fn);
    this.middleware.push(route);
    this.runner.attach(route);
    return this;
  }

  /**
   * Register a POST route.
   * @param {string} path - Request path
   * @param {Function} fn - Handler function
   * @returns {Application} this
   */
  post(path, fn) {
    const route = this._createRoute('POST', path, fn);
    this.middleware.push(route);
    this.runner.attach(route);
    return this;
  }

  /**
   * Register a PUT route.
   * @param {string} path - Request path
   * @param {Function} fn - Handler function
   * @returns {Application} this
   */
  put(path, fn) {
    const route = this._createRoute('PUT', path, fn);
    this.middleware.push(route);
    this.runner.attach(route);
    return this;
  }

  /**
   * Register a DELETE route.
   * @param {string} path - Request path
   * @param {Function} fn - Handler function
   * @returns {Application} this
   */
  delete(path, fn) {
    const route = this._createRoute('DELETE', path, fn);
    this.middleware.push(route);
    this.runner.attach(route);
    return this;
  }

  /**
   * Register a PATCH route.
   * @param {string} path - Request path
   * @param {Function} fn - Handler function
   * @returns {Application} this
   */
  patch(path, fn) {
    const route = this._createRoute('PATCH', path, fn);
    this.middleware.push(route);
    this.runner.attach(route);
    return this;
  }

  /**
   * Register an OPTIONS route.
   * @param {string} path - Request path
   * @param {Function} fn - Handler function
   * @returns {Application} this
   */
  options(path, fn) {
    const route = this._createRoute('OPTIONS', path, fn);
    this.middleware.push(route);
    this.runner.attach(route);
    return this;
  }

  /**
   * Register a HEAD route.
   * @param {string} path - Request path
   * @param {Function} fn - Handler function
   * @returns {Application} this
   */
  head(path, fn) {
    const route = this._createRoute('HEAD', path, fn);
    this.middleware.push(route);
    this.runner.attach(route);
    return this;
  }

  /**
   * Register an ALL route (matches any method).
   * @param {string} path - Request path
   * @param {Function} fn - Handler function
   * @returns {Application} this
   */
  all(path, fn) {
    validateMiddleware(fn);
    const route = async (ctx, next) => {
      if (ctx.path === path) {
        return fn(ctx, next);
      }
      return next();
    };
    this.middleware.push(route);
    this.runner.attach(route);
    return this;
  }

  /**
   * Start the server.
   * @param {...any} args - Arguments forwarded to server.listen
   * @returns {http.Server}
   */
  listen(...args) {
    const server = http.createServer(this.callback());
    return server.listen(...args);
  }

  /**
   * Return a request handler callback for node's native http server.
   * @returns {Function}
   */
  callback() {
    // Use runner's compose for sequential middleware execution
    // Runner manages middleware and runs them between request and response cycle
    const fn = this.runner.compose();

    const handleRequest = (req, res) => {
      const ctx = this.createContext(req, res);
      return this.handleRequest(ctx, fn);
    };

    return handleRequest;
  }

  /**
   * Handle request using synchronous runner for middleware.
   * Middleware runs sequentially between request and response cycle.
   * @param {Context} ctx
   * @param {Function} fnMiddleware
   * @returns {Promise}
   */
  handleRequest(ctx, fnMiddleware) {
    const res = ctx.res;
    res.statusCode = 404;
    const onerror = err => this.onerror(err, ctx);
    const handleResponse = () => respond(ctx);

    // Runner runs middleware sequentially between request and response cycle
    return fnMiddleware(ctx)
      .then(handleResponse)
      .catch(onerror);
  }

  /**
   * Create a new context for the request.
   * @param {Object} req - Node request
   * @param {Object} res - Node response
   * @returns {Context}
   */
  createContext(req, res) {
    return createContext(this, req, res);
  }

  /**
   * Default error handler.
   * @param {Error} err
   * @param {Context} ctx
   */
  onerror(err, ctx) {
    handleError(err, ctx, this.silent);
  }

  /**
   * Return JSON representation.
   * @returns {Object}
   */
  toJSON() {
    return appToJSON(this);
  }

  /**
   * Inspect implementation.
   * @returns {Object}
   */
  [util.inspect.custom]() {
    return this.toJSON();
  }
}
