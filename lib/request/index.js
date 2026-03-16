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
  getOriginalUrl,
  parseRequestCookies,
  getBasicAuth,
  getBearerToken,
  getUserAgent,
  getReferer,
  isUpgradeRequest,
  getUpgradeType,
  parseRange,
  expectsJson,
  expectsHtml,
  getOrigin,
  isCrossOrigin,
  readBody,
  parseBody,
  getRequestId,
  getTimingInfo,
  parseQueryString
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
    
    // Cache for parsed data
    this._cookies = null;
    this._body = null;
    this._rawBody = null;
    this._parsedBody = null;
    this._startTime = Date.now();
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

  /**
   * Get request cookies
   * @returns {Object}
   */
  get cookies() {
    if (!this._cookies) {
      this._cookies = parseRequestCookies(this.req.headers);
    }
    return this._cookies;
  }

  /**
   * Get a specific cookie
   * @param {string} name
   * @returns {string|undefined}
   */
  cookie(name) {
    return this.cookies[name];
  }

  /**
   * Get basic auth credentials
   * @returns {Object|null} { username, password }
   */
  get auth() {
    return getBasicAuth(this.req.headers);
  }

  /**
   * Get bearer token
   * @returns {string|null}
   */
  get bearerToken() {
    return getBearerToken(this.req.headers);
  }

  /**
   * Get user agent
   * @returns {string}
   */
  get userAgent() {
    return getUserAgent(this.req.headers);
  }

  /**
   * Get referer
   * @returns {string}
   */
  get referer() {
    return getReferer(this.req.headers);
  }

  /**
   * Check if request is an upgrade request
   * @returns {boolean}
   */
  get isUpgrade() {
    return isUpgradeRequest(this.req.headers);
  }

  /**
   * Get upgrade type (e.g., 'websocket')
   * @returns {string}
   */
  get upgradeType() {
    return getUpgradeType(this.req.headers);
  }

  /**
   * Parse range header
   * @returns {Object|null}
   */
  get range() {
    const rangeHeader = this.get('Range');
    return parseRange(rangeHeader);
  }

  /**
   * Check if request expects JSON
   * @returns {boolean}
   */
  get expectsJson() {
    return expectsJson(this.req.headers);
  }

  /**
   * Check if request expects HTML
   * @returns {boolean}
   */
  get expectsHtml() {
    return expectsHtml(this.req.headers);
  }

  /**
   * Get origin header
   * @returns {string}
   */
  get origin() {
    return getOrigin(this.req.headers);
  }

  /**
   * Check if request is cross-origin
   * @returns {boolean}
   */
  get isCrossOrigin() {
    return isCrossOrigin(this.req.headers, this.host);
  }

  /**
   * Get request ID
   * @returns {string}
   */
  get requestId() {
    return getRequestId(this.req.headers);
  }

  /**
   * Get request timing info
   * @returns {Object}
   */
  get timing() {
    return getTimingInfo(this._startTime);
  }

  /**
   * Read and return the request body as a buffer
   * @returns {Promise<Buffer>}
   */
  async buffer() {
    if (!this._rawBody) {
      this._rawBody = await readBody(this.req);
    }
    return this._rawBody;
  }

  /**
   * Read and parse the request body based on content-type
   * @returns {Promise<any>}
   */
  async parse() {
    if (!this._parsedBody) {
      const body = await this.buffer();
      this._parsedBody = parseBody(body, this.type);
    }
    return this._parsedBody;
  }

  /**
   * Read and parse body as JSON
   * @returns {Promise<Object>}
   */
  async json() {
    const body = await this.buffer();
    return JSON.parse(body.toString('utf8'));
  }

  /**
   * Read and parse body as form-urlencoded
   * @returns {Promise<Object>}
   */
  async form() {
    const body = await this.buffer();
    return parseQueryString(body.toString('utf8'));
  }

  /**
   * Read body as text
   * @returns {Promise<string>}
   */
  async text() {
    const body = await this.buffer();
    return body.toString('utf8');
  }

  /**
   * Check if request has body
   * @returns {boolean}
   */
  get hasBody() {
    return this.length > 0 || this.type !== '';
  }

  /**
   * Check if request is a GET request
   * @returns {boolean}
   */
  get isGet() {
    return this.method === 'GET';
  }

  /**
   * Check if request is a POST request
   * @returns {boolean}
   */
  get isPost() {
    return this.method === 'POST';
  }

  /**
   * Check if request is a PUT request
   * @returns {boolean}
   */
  get isPut() {
    return this.method === 'PUT';
  }

  /**
   * Check if request is a DELETE request
   * @returns {boolean}
   */
  get isDelete() {
    return this.method === 'DELETE';
  }

  /**
   * Check if request is a PATCH request
   * @returns {boolean}
   */
  get isPatch() {
    return this.method === 'PATCH';
  }

  /**
   * Check if request is a HEAD request
   * @returns {boolean}
   */
  get isHead() {
    return this.method === 'HEAD';
  }

  /**
   * Check if request is an OPTIONS request
   * @returns {boolean}
   */
  get isOptions() {
    return this.method === 'OPTIONS';
  }

  /**
   * Get request info as JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      method: this.method,
      url: this.url,
      path: this.path,
      query: this.query,
      headers: this.headers,
      protocol: this.protocol,
      secure: this.secure,
      ip: this.ctx?.ip,
      cookies: this.cookies,
      timing: this.timing
    };
  }
}
