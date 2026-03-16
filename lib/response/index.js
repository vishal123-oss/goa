/**
 * Response Module
 * Response abstraction for Goa framework
 */

import {
  getStatusMessage,
  shouldNotHaveBody,
  isRedirectStatus,
  getMimeType,
  getTypeForBody,
  calculateContentLength,
  setHeader,
  getHeader,
  appendHeader,
  removeHeader,
  getAllHeaders,
  isHeadersSent,
  isWritable,
  formatRedirectUrl,
  createRedirectBody,
  createContentDisposition,
  formatEtag,
  setVaryHeader,
  flushHeaders,
  endResponse,
  setCacheControl,
  setNoCache,
  setCorsHeaders,
  setCookie,
  clearCookie,
  sendJson,
  sendHtml,
  sendText,
  sendError,
  isResponseSent,
  getResponseTimeHeader
} from './utils.js';

import { HTTP_STATUS_MESSAGES, RESPONSE_CONFIG } from './constants.js';

/**
 * Response class for Goa framework.
 * Wraps the native Node.js ServerResponse.
 */
export default class Response {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.app = null;
    this.ctx = null;
    this._body = undefined;
    this._explicitStatus = false;
  }

  /**
   * Get response status code.
   * @returns {number}
   */
  get status() {
    return this.res.statusCode;
  }

  /**
   * Set response status code.
   * @param {number} code
   */
  set status(code) {
    if (isHeadersSent(this.res)) return;
    this._explicitStatus = true;
    this.res.statusCode = code;
    
    if (this.req.httpVersionMajor < 2) {
      this.res.statusMessage = getStatusMessage(code);
    }
    
    if (this._body && shouldNotHaveBody(code)) {
      this._body = null;
    }
  }

  /**
   * Get response status message.
   * @returns {string}
   */
  get message() {
    return this.res.statusMessage || getStatusMessage(this.res.statusCode) || '';
  }

  /**
   * Set response status message.
   * @param {string} msg
   */
  set message(msg) {
    this.res.statusMessage = msg;
  }

  /**
   * Get response body.
   * @returns {any}
   */
  get body() {
    return this._body;
  }

  /**
   * Set response body.
   * @param {any} val
   */
  set body(val) {
    const original = this._body;
    this._body = val;

    // No content
    if (val == null) {
      if (!shouldNotHaveBody(this.status)) {
        this.status = 204;
      }
      return;
    }

    // Set default status if not explicitly set
    if (!this._explicitStatus) {
      this.status = 200;
    }

    // Auto-set content-type if not set
    const setType = !getHeader(this.res, 'content-type');
    if (setType) {
      this.type = getTypeForBody(val);
    }

    // Calculate and set content length
    const length = calculateContentLength(val);
    if (length !== undefined) {
      this.length = length;
    }
  }

  /**
   * Get response length.
   * @returns {number|undefined}
   */
  get length() {
    const len = getHeader(this.res, 'content-length');
    if (len === undefined) return undefined;
    return parseInt(len, 10);
  }

  /**
   * Set response length.
   * @param {number} n
   */
  set length(n) {
    setHeader(this.res, 'Content-Length', n);
  }

  /**
   * Get response header.
   * @param {string} field
   * @returns {string|undefined}
   */
  get(field) {
    return getHeader(this.res, field);
  }

  /**
   * Set response header.
   * @param {string} field
   * @param {string} val
   */
  set(field, val) {
    if (field && typeof field === 'object') {
      for (const [key, value] of Object.entries(field)) {
        setHeader(this.res, key, value);
      }
      return;
    }
    setHeader(this.res, field, val);
  }

  /**
   * Append response header.
   * @param {string} field
   * @param {string|string[]} val
   */
  append(field, val) {
    appendHeader(this.res, field, val);
  }

  /**
   * Remove response header.
   * @param {string} field
   */
  remove(field) {
    removeHeader(this.res, field);
  }

  /**
   * Get all response headers.
   * @returns {Object}
   */
  get header() {
    return getAllHeaders(this.res);
  }

  /**
   * Set response headers from object.
   * @param {Object} obj
   */
  set headers(obj) {
    for (const key of Object.keys(obj)) {
      this.set(key, obj[key]);
    }
  }

  /**
   * Get response type.
   * @returns {string}
   */
  get type() {
    const type = this.get('Content-Type');
    if (!type) return '';
    return type.split(';')[0];
  }

  /**
   * Set response type.
   * @param {string} type
   */
  set type(type) {
    const mimeType = getMimeType(type);
    if (mimeType) {
      setHeader(this.res, 'Content-Type', mimeType);
    }
  }

  /**
   * Get Content-Type charset.
   * @returns {string}
   */
  get charset() {
    const type = this.get('Content-Type');
    if (!type) return '';
    const match = /charset=([^;]+)/i.exec(type);
    return match ? match[1].trim() : '';
  }

  /**
   * Set Content-Type charset.
   * @param {string} charset
   */
  set charset(charset) {
    if (!charset) return;
    const type = this.get('Content-Type') || 'text/plain';
    const base = type.split(';')[0].trim();
    setHeader(this.res, 'Content-Type', `${base}; charset=${charset}`);
  }

  /**
   * Check if response headers have been sent.
   * @returns {boolean}
   */
  get headerSent() {
    return isHeadersSent(this.res);
  }

  /**
   * Get response last-modified.
   * @returns {Date|undefined}
   */
  get lastModified() {
    const date = this.get('Last-Modified');
    if (date) return new Date(date);
    return undefined;
  }

  /**
   * Set response last-modified.
   * @param {Date|string} val
   */
  set lastModified(val) {
    setHeader(this.res, 'Last-Modified', val.toUTCString());
  }

  /**
   * Get response etag.
   * @returns {string|undefined}
   */
  get etag() {
    return this.get('ETag');
  }

  /**
   * Set response etag.
   * @param {string} val
   */
  set etag(val) {
    setHeader(this.res, 'ETag', formatEtag(val));
  }

  /**
   * Vary response header.
   * @param {string} field
   */
  vary(field) {
    setVaryHeader(this.res, field);
  }

  /**
   * Redirect to url.
   * @param {string} url
   * @param {string} [alt]
   */
  redirect(url, alt) {
    const referer = this.ctx?.get('Referrer');
    const location = formatRedirectUrl(url, referer, alt);
    
    setHeader(this.res, 'Location', location);

    if (!isRedirectStatus(this.status)) {
      this.status = 302;
    }

    const acceptsHtml = this.ctx?.accepts('html');
    const { body, type } = createRedirectBody(location, acceptsHtml);
    
    this.type = type;
    this.body = body;
  }

  /**
   * Set Content-Disposition header.
   * @param {string} [filename]
   * @param {Object} [options]
   */
  attachment(filename, options) {
    if (filename) {
      this.type = filename.split('.').pop();
    }
    setHeader(this.res, 'Content-Disposition', createContentDisposition(filename, options));
  }

  /**
   * Check if response is writable.
   * @returns {boolean}
   */
  get writable() {
    return isWritable(this.res);
  }

  /**
   * Inspect implementation.
   * @returns {Object}
   */
  inspect() {
    if (!this.res) return;
    const o = this.toJSON();
    o.body = this.body;
    return o;
  }

  /**
   * Return JSON representation.
   * @returns {Object}
   */
  toJSON() {
    return {
      status: this.status,
      message: this.message,
      header: this.header
    };
  }

  /**
   * Flush any set headers.
   */
  flushHeaders() {
    flushHeaders(this.res);
  }

  /**
   * Set cache control header
   * @param {string|number} value
   */
  cacheControl(value) {
    setCacheControl(this.res, value);
  }

  /**
   * Set no-cache headers
   */
  noCache() {
    setNoCache(this.res);
  }

  /**
   * Set CORS headers
   * @param {Object} options
   */
  cors(options = {}) {
    setCorsHeaders(this.res, options);
  }

  /**
   * Set cookie
   * @param {string} name
   * @param {string} value
   * @param {Object} options
   */
  cookie(name, value, options = {}) {
    setCookie(this.res, name, value, options);
  }

  /**
   * Clear cookie
   * @param {string} name
   * @param {Object} options
   */
  clearCookie(name, options = {}) {
    clearCookie(this.res, name, options);
  }

  /**
   * Get/set response body via alias.
   */
  get bodyValue() {
    return this.body;
  }

  set bodyValue(val) {
    this.body = val;
  }

  /**
   * Get response status code alias.
   */
  get statusCode() {
    return this.status;
  }

  set statusCode(code) {
    this.status = code;
  }

  /**
   * Get/set response status alias.
   */
  get statusValue() {
    return this.status;
  }

  set statusValue(code) {
    this.status = code;
  }

  /**
   * Get/set response message alias.
   */
  get statusMessage() {
    return this.message;
  }

  set statusMessage(message) {
    this.message = message;
  }

  /**
   * Send JSON response
   * @param {any} data
   */
  json(data) {
    this.type = 'application/json';
    this.body = data;
  }

  /**
   * Send plain text response
   * @param {string} text
   */
  text(text) {
    this.type = 'text/plain';
    this.body = text;
  }

  /**
   * Send response body (alias to body assignment).
   * @param {any} body
   */
  send(body) {
    this.body = body;
  }

  /**
   * Send HTML response
   * @param {string} html
   */
  html(html) {
    this.type = 'text/html';
    this.body = html;
  }

  /**
   * Send response with status
   * @param {number} status
   * @param {any} body
   */
  sendStatus(status, body) {
    this.status = status;
    this.body = body ?? (getStatusMessage(status) || String(status));
  }

  /**
   * Throw a response error.
   * @param {number} status
   * @param {string} message
   */
  throw(status, message) {
    const err = new Error(message || getStatusMessage(status));
    err.status = status;
    err.statusCode = status;
    err.expose = true;
    throw err;
  }

  /**
   * Assert response condition.
   * @param {any} condition
   * @param {number} status
   * @param {string} message
   */
  assert(condition, status, message) {
    if (!condition) {
      this.throw(status, message);
    }
  }

  /**
   * Check if response has been sent
   * @returns {boolean}
   */
  get sent() {
    return isResponseSent(this.res);
  }

  /**
   * Get response timing info
   * @returns {string}
   */
  getResponseTime(startTime) {
    return getResponseTimeHeader(startTime);
  }

  /**
   * Set link header for pagination
   * @param {Array} links
   */
  links(links) {
    const linkHeader = Object.entries(links)
      .map(([rel, url]) => `<${url}>; rel="${rel}"`)
      .join(', ');
    this.set('Link', linkHeader);
  }

  /**
   * Set location header
   * @param {string} url
   */
  location(url) {
    this.set('Location', url);
  }

  /**
   * Check if response is ok (2xx)
   * @returns {boolean}
   */
  get ok() {
    return this.status >= 200 && this.status < 300;
  }

  /**
   * Check if response is a redirect (3xx)
   * @returns {boolean}
   */
  get isRedirect() {
    return this.status >= 300 && this.status < 400;
  }

  /**
   * Check if response is a client error (4xx)
   * @returns {boolean}
   */
  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if response is a server error (5xx)
   * @returns {boolean}
   */
  get isServerError() {
    return this.status >= 500 && this.status < 600;
  }
}
