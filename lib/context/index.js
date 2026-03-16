import util from 'util';
import {
  createContextState,
  isContextValid,
  getHeader,
  setHeader,
  appendHeader,
  removeHeader,
  accepts,
  createContextAccepts,
  getClientIp,
  getClientIps,
  getSubdomains,
  redirect,
  attachment,
  varyHeader,
  throwError,
  assertCondition,
  contextToJSON,
  inspectContext
} from './utils.js';

import { CONTEXT_CONFIG, CONTEXT_ERRORS } from './constants.js';

/**
 * Context class for Goa framework.
 * Encapsulates Node's request and response objects.
 */
export default class Context {
  constructor() {
    this.req = null;
    this.res = null;
    this.app = null;
    this.request = null;
    this.response = null;
    this.state = createContextState();
    this.respond = CONTEXT_CONFIG.respond;
    this._accept = null;
  }

  /**
   * Get response status code.
   * @returns {number}
   */
  get status() {
    return this.response.status;
  }

  /**
   * Set response status code.
   * @param {number} code
   */
  set status(code) {
    this.response.status = code;
  }

  /**
   * Get response body.
   * @returns {any}
   */
  get body() {
    return this.response.body;
  }

  /**
   * Set response body.
   * @param {any} val
   */
  set body(val) {
    this.response.body = val;
  }

  /**
   * Get request URL.
   * @returns {string}
   */
  get url() {
    return this.request.url;
  }

  /**
   * Set request URL.
   * @param {string} val
   */
  set url(val) {
    this.request.url = val;
  }

  /**
   * Get request method.
   * @returns {string}
   */
  get method() {
    return this.request.method;
  }

  /**
   * Set request method.
   * @param {string} val
   */
  set method(val) {
    this.request.method = val;
  }

  /**
   * Get request path.
   * @returns {string}
   */
  get path() {
    return this.request.path;
  }

  /**
   * Set request path.
   * @param {string} path
   */
  set path(path) {
    this.request.path = path;
  }

  /**
   * Get request query string.
   * @returns {string}
   */
  get querystring() {
    return this.request.querystring;
  }

  /**
   * Set request query string.
   * @param {string} str
   */
  set querystring(str) {
    this.request.querystring = str;
  }

  /**
   * Get parsed query.
   * @returns {Object}
   */
  get query() {
    return this.request.query;
  }

  /**
   * Get request headers.
   * @returns {Object}
   */
  get headers() {
    return this.request.headers;
  }

  /**
   * Get request header.
   * @param {string} field
   * @returns {string}
   */
  get(field) {
    return getHeader(this, field);
  }

  /**
   * Set response header.
   * @param {string} field
   * @param {string} val
   */
  set(field, val) {
    setHeader(this, field, val);
  }

  /**
   * Append response header.
   * @param {string} field
   * @param {string|string[]} val
   */
  append(field, val) {
    appendHeader(this, field, val);
  }

  /**
   * Remove response header.
   * @param {string} field
   */
  remove(field) {
    removeHeader(this, field);
  }

  /**
   * Check if request accepts given type.
   * @param {...string} args
   * @returns {string|false}
   */
  accepts(...args) {
    return accepts(this, ...args);
  }

  /**
   * Get request accept object.
   * @returns {Object}
   */
  get accept() {
    return this._accept || (this._accept = createContextAccepts(this));
  }

  /**
   * Check if request is fresh.
   * @returns {boolean}
   */
  get fresh() {
    return this.request.fresh;
  }

  /**
   * Check if request is stale.
   * @returns {boolean}
   */
  get stale() {
    return this.request.stale;
  }

  /**
   * Check if request was made with XMLHttpRequest.
   * @returns {boolean}
   */
  get xhr() {
    return this.request.xhr;
  }

  /**
   * Get request socket.
   * @returns {Object}
   */
  get socket() {
    return this.request.socket;
  }

  /**
   * Get request protocol.
   * @returns {string}
   */
  get protocol() {
    return this.request.protocol;
  }

  /**
   * Check if request is secure.
   * @returns {boolean}
   */
  get secure() {
    return this.request.secure;
  }

  /**
   * Get request hostname.
   * @returns {string|undefined}
   */
  get hostname() {
    return this.request.hostname;
  }

  /**
   * Get request host.
   * @returns {string|undefined}
   */
  get host() {
    return this.request.host;
  }

  /**
   * Get request IP.
   * @returns {string}
   */
  get ip() {
    return getClientIp(this);
  }

  /**
   * Get request IPs (from X-Forwarded-For when proxy is true).
   * @returns {string[]}
   */
  get ips() {
    return getClientIps(this);
  }

  /**
   * Get request subdomains.
   * @returns {string[]}
   */
  get subdomains() {
    return getSubdomains(this);
  }

  /**
   * Check if response headers have been sent.
   * @returns {boolean}
   */
  get headerSent() {
    return this.response.headerSent;
  }

  /**
   * Get request length.
   * @returns {number|undefined}
   */
  get length() {
    return this.response.length;
  }

  /**
   * Set request length.
   * @param {number} n
   */
  set length(n) {
    this.response.length = n;
  }

  /**
   * Get request type.
   * @returns {string}
   */
  get type() {
    return this.response.type;
  }

  /**
   * Set request type.
   * @param {string} type
   */
  set type(type) {
    this.response.type = type;
  }

  /**
   * Get request last-modified.
   * @returns {Date|undefined}
   */
  get lastModified() {
    return this.response.lastModified;
  }

  /**
   * Set request last-modified.
   * @param {Date|string} val
   */
  set lastModified(val) {
    this.response.lastModified = val;
  }

  /**
   * Get request etag.
   * @returns {string|undefined}
   */
  get etag() {
    return this.response.etag;
  }

  /**
   * Set request etag.
   * @param {string} val
   */
  set etag(val) {
    this.response.etag = val;
  }

  /**
   * Vary response header.
   * @param {string} field
   */
  vary(field) {
    varyHeader(this, field);
  }

  /**
   * Redirect to url.
   * @param {string} url
   * @param {string} [alt]
   */
  redirect(url, alt) {
    redirect(this, url, alt);
  }

  /**
   * Set Content-Disposition header.
   * @param {string} [filename]
   * @param {Object} [options]
   */
  attachment(filename, options) {
    attachment(this, filename, options);
  }

  /**
   * Check if response is writable.
   * @returns {boolean}
   */
  get writable() {
    return this.response.writable;
  }

  /**
   * Set response header from object.
   * @param {Object} obj
   */
  set headers(obj) {
    this.response.headers = obj;
  }

  /**
   * Throw an error with status code.
   * @param {number} status
   * @param {string} [msg]
   * @param {Object} [props]
   * @throws {Error}
   */
  throw(status, msg, props) {
    throwError(status, msg, props);
  }

  /**
   * Assert a condition.
   * @param {any} value
   * @param {number} status
   * @param {string} [msg]
   * @param {Object} [props]
   */
  assert(value, status, msg, props) {
    assertCondition(value, status, msg, props);
  }

  /**
   * Inspect implementation.
   * @returns {Object}
   */
  [util.inspect.custom]() {
    return contextToJSON(this);
  }

  /**
   * Return JSON representation.
   * @returns {Object}
   */
  toJSON() {
    return contextToJSON(this);
  }
}
