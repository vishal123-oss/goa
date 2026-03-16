import http from 'http';
import util from 'util';

import Request from '../request/index.js';
import Response from '../response/index.js';
import Context from '../context/index.js';
import { compose } from '../compose/index.js';

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
