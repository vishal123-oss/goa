/**
 * Request abstraction for Goa framework.
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
   * @returns {string|undefined}
   */
  get(field) {
    const req = this.req;
    switch (field = field.toLowerCase()) {
      case 'referer':
      case 'referrer':
        return req.headers.referrer || req.headers.referer || '';
      default:
        return req.headers[field] || '';
    }
  }

  /**
   * Return the request header (alias for get).
   * @param {string} field
   * @returns {string|undefined}
   */
  header(field) {
    return this.get(field);
  }

  /**
   * Get all request headers.
   * @returns {Object}
   */
  get headers() {
    return this.req.headers;
  }

  /**
   * Return the request query string.
   * @returns {string}
   */
  get querystring() {
    if (!this.req) return '';
    const index = this.req.url.indexOf('?');
    return index === -1 ? '' : this.req.url.substring(index + 1);
  }

  /**
   * Set the request query string.
   * @param {string} str
   */
  set querystring(str) {
    const index = this.req.url.indexOf('?');
    this.req.url = this.req.url.substring(0, index) + '?' + str;
  }

  /**
   * Return parsed query string.
   * @returns {Object}
   */
  get query() {
    const str = this.querystring;
    const urlSearchParams = new URLSearchParams(str);
    const query = {};
    for (const [key, value] of urlSearchParams) {
      if (query[key] !== undefined) {
        if (Array.isArray(query[key])) {
          query[key].push(value);
        } else {
          query[key] = [query[key], value];
        }
      } else {
        query[key] = value;
      }
    }
    return query;
  }

  /**
   * Return the request pathname.
   * @returns {string}
   */
  get path() {
    const url = this.req.url;
    const index = url.indexOf('?');
    return index === -1 ? url : url.substring(0, index);
  }

  /**
   * Set the request pathname.
   * @param {string} path
   */
  set path(path) {
    const url = this.req.url;
    const index = url.indexOf('?');
    this.req.url = path + (index === -1 ? '' : url.substring(index));
  }

  /**
   * Return the original request object.
   * @returns {Object}
   */
  get originalUrl() {
    return this.req.url;
  }

  /**
   * Check if the request is fresh.
   * @returns {boolean}
   */
  get fresh() {
    const method = this.req.method;
    const status = this.res.statusCode;

    // GET or HEAD for weak freshness validation only
    if ('GET' !== method && 'HEAD' !== method) return false;

    // 2xx or 304 as per rfc2616 14.26
    if ((status >= 200 && status < 300) || 304 === status) {
      return this.stale === false;
    }

    return false;
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
    const methods = ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'TRACE'];
    return methods.includes(this.req.method);
  }

  /**
   * Return the request length.
   * @returns {number|undefined}
   */
  get length() {
    const len = this.get('content-length');
    if (len === '') return undefined;
    return parseInt(len, 10);
  }

  /**
   * Return the request protocol.
   * @returns {string}
   */
  get protocol() {
    if (this.req.socket.encrypted) return 'https';
    return 'http';
  }

  /**
   * Check if the request is secure.
   * @returns {boolean}
   */
  get secure() {
    return this.protocol === 'https';
  }

  /**
   * Get the request socket.
   * @returns {Object}
   */
  get socket() {
    return this.req.socket;
  }

  /**
   * Get the request hostname.
   * @returns {string|undefined}
   */
  get hostname() {
    const host = this.get('host');
    if (!host) return;
    // IPv6
    if (host.startsWith('[')) {
      return host.substring(1, host.indexOf(']'));
    }
    return host.split(':')[0];
  }

  /**
   * Get the request host (hostname:port).
   * @returns {string|undefined}
   */
  get host() {
    return this.get('host');
  }

  /**
   * Check if the request was made with XMLHttpRequest.
   * @returns {boolean}
   */
  get xhr() {
    const val = this.get('x-requested-with') || '';
    return val.toLowerCase() === 'xmlhttprequest';
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
    const contentType = this.get('content-type');
    if (!contentType) return undefined;
    const match = /charset=([^;]+)/i.exec(contentType);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Get the request type (without charset).
   * @returns {string}
   */
  get type() {
    const type = this.get('content-type');
    if (!type) return '';
    return type.split(';')[0].trim();
  }

  /**
   * Get the request Accept header.
   * @returns {string}
   */
  get accept() {
    return this.get('accept');
  }
}
