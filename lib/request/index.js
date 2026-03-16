/**
 * Request Module
 * Request abstraction for Goa framework
 */

import {
  getHeader,
  getAllHeaders,
  getProtocol,
  isSecure,
  getPath,
  getQueryString,
  getQuery,
  getHostname,
  getHost,
  isXMLHttpRequest,
  isIdempotentMethod,
  isFresh,
  getContentLength,
  getContentType,
  getCharset,
  getAcceptHeader,
  getSocket,
  getOriginalUrl
} from './utils.js';

import { PROTOCOLS, HTTP_METHODS } from './constants.js';

/**
 * Request class for Goa framework.
 * Wraps the native Node.js IncomingMessage.
 */
export default class Request {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.app = null;
    this.ctx = null;
  }

  /**
   * Return the request URL.
   * @returns {string}
   */
  get url() {
    return this.req.url;
  }

  /**
   * Set the request URL.
   * @param {string} val
   */
  set url(val) {
    this.req.url = val;
  }

  /**
   * Return the request method.
   * @returns {string}
   */
  get method() {
    return this.req.method;
  }

  /**
   * Set the request method.
   * @param {string} val
   */
  set method(val) {
    this.req.method = val;
  }

  /**
   * Return the request header.
   * @param {string} field
   * @returns {string}
   */
  get(field) {
    return getHeader(this.req.headers, field);
  }

  /**
   * Return the request header (alias for get).
   * @param {string} field
   * @returns {string}
   */
  header(field) {
    return this.get(field);
  }

  /**
   * Get all request headers.
   * @returns {Object}
   */
  get headers() {
    return getAllHeaders(this.req);
  }

  /**
   * Return the request query string.
   * @returns {string}
   */
  get querystring() {
    if (!this.req) return '';
    return getQueryString(this.req.url);
  }

  /**
   * Set the request query string.
   * @param {string} str
   */
  set querystring(str) {
    const url = this.req.url;
    const path = getPath(url);
    this.req.url = path + '?' + str;
  }

  /**
   * Return parsed query string.
   * @returns {Object}
   */
  get query() {
    return getQuery(this.req.url);
  }

  /**
   * Return the request pathname.
   * @returns {string}
   */
  get path() {
    return getPath(this.req.url);
  }

  /**
   * Set the request pathname.
   * @param {string} path
   */
  set path(path) {
    const url = this.req.url;
    const qs = getQueryString(url);
    this.req.url = qs ? path + '?' + qs : path;
  }

  /**
   * Return the original request object.
   * @returns {Object}
   */
  get originalUrl() {
    return getOriginalUrl(this.req);
  }

  /**
   * Check if the request is fresh.
   * @returns {boolean}
   */
  get fresh() {
    return isFresh(this.req, this.res.statusCode);
  }

  /**
   * Check if the request is stale.
   * @returns {boolean}
   */
  get stale() {
    return !this.fresh;
  }

  /**
   * Check if the request is idempotent.
   * @returns {boolean}
   */
  get idempotent() {
    return isIdempotentMethod(this.req.method);
  }

  /**
   * Return the request length.
   * @returns {number|undefined}
   */
  get length() {
    return getContentLength(this.req.headers);
  }

  /**
   * Return the request protocol.
   * @returns {string}
   */
  get protocol() {
    return getProtocol(this.req, this.req.socket);
  }

  /**
   * Check if the request is secure.
   * @returns {boolean}
   */
  get secure() {
    return isSecure(this.req, this.req.socket);
  }

  /**
   * Get the request socket.
   * @returns {Object}
   */
  get socket() {
    return getSocket(this.req);
  }

  /**
   * Get the request hostname.
   * @returns {string|undefined}
   */
  get hostname() {
    return getHostname(this.req.headers);
  }

  /**
   * Get the request host (hostname:port).
   * @returns {string|undefined}
   */
  get host() {
    return getHost(this.req.headers);
  }

  /**
   * Check if the request was made with XMLHttpRequest.
   * @returns {boolean}
   */
  get xhr() {
    return isXMLHttpRequest(this.req.headers);
  }

  /**
   * Get request body (to be populated by body parser middleware).
   * @returns {any}
   */
  get body() {
    return this._body;
  }

  /**
   * Set request body.
   * @param {any} val
   */
  set body(val) {
    this._body = val;
  }

  /**
   * Get the raw request body.
   * @returns {Buffer|undefined}
   */
  get rawBody() {
    return this._rawBody;
  }

  /**
   * Set the raw request body.
   * @param {Buffer} val
   */
  set rawBody(val) {
    this._rawBody = val;
  }

  /**
   * Get the request charset.
   * @returns {string|undefined}
   */
  get charset() {
    return getCharset(this.req.headers);
  }

  /**
   * Get the request type (without charset).
   * @returns {string}
   */
  get type() {
    return getContentType(this.req.headers);
  }

  /**
   * Get the request Accept header.
   * @returns {string}
   */
  get accept() {
    return getAcceptHeader(this.req.headers);
  }
}
