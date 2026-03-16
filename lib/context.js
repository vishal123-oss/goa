import util from 'util';

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
    this.state = {};
    this.respond = true;
    this._body = undefined;
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
   * @returns {string|undefined}
   */
  get(field) {
    return this.request.get(field);
  }

  /**
   * Set response header.
   * @param {string} field
   * @param {string} val
   */
  set(field, val) {
    this.response.set(field, val);
  }

  /**
   * Append response header.
   * @param {string} field
   * @param {string|string[]} val
   */
  append(field, val) {
    return this.response.append(field, val);
  }

  /**
   * Remove response header.
   * @param {string} field
   */
  remove(field) {
    this.response.remove(field);
  }

  /**
   * Check if request accepts given type.
   * @param {string|string[]} ...args
   * @returns {string|false}
   */
  accepts(...args) {
    return this.accept.types(...args);
  }

  /**
   * Get request accept object.
   * @returns {Object}
   */
  get accept() {
    return this._accept || (this._accept = accepts(this.req));
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
    const proxy = this.app.proxy;
    if (proxy) {
      const val = this.get('X-Forwarded-For');
      if (val) {
        return val.split(/\s*,\s*/)[0];
      }
    }
    return this.request.socket.remoteAddress || '';
  }

  /**
   * Get request IPs (from X-Forwarded-For when proxy is true).
   * @returns {string[]}
   */
  get ips() {
    const proxy = this.app.proxy;
    const val = this.get('X-Forwarded-For');
    return proxy && val ? val.split(/\s*,\s*/) : [];
  }

  /**
   * Get request subdomains.
   * @returns {string[]}
   */
  get subdomains() {
    const hostname = this.hostname;
    if (!hostname) return [];
    const offset = this.app.subdomainOffset;
    const subdomains = hostname.split('.').reverse().slice(offset);
    return subdomains;
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
    this.response.vary(field);
  }

  /**
   * Redirect to url.
   * @param {string} url
   * @param {string} [alt]
   */
  redirect(url, alt) {
    this.response.redirect(url, alt);
  }

  /**
   * Set Content-Disposition header.
   * @param {string} [filename]
   * @param {Object} [options]
   */
  attachment(filename, options) {
    this.response.attachment(filename, options);
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
   */
  throw(status, msg, props) {
    if (typeof msg === 'object') {
      props = msg;
      msg = '';
    }
    const err = new Error(msg || 'Error');
    err.expose = true;
    err.status = status;
    err.statusCode = status;
    if (props) Object.assign(err, props);
    throw err;
  }

  /**
   * Assert a condition.
   * @param {any} value
   * @param {number} status
   * @param {string} [msg]
   * @param {Object} [props]
   */
  assert(value, status, msg, props) {
    if (!value) this.throw(status, msg, props);
  }

  /**
   * Create a delegate property on context.
   * @param {string} name
   * @param {string} target
   */
  static createDelegates() {
    // Delegates are set up via property accessors in the class
  }

  /**
   * Inspect implementation.
   * @returns {Object}
   */
  [util.inspect.custom]() {
    return this.toJSON();
  }

  /**
   * Return JSON representation.
   * @returns {Object}
   */
  toJSON() {
    return {
      request: this.request.toJSON ? this.request.toJSON() : this.request,
      response: this.response.toJSON ? this.response.toJSON() : this.response,
      app: this.app.toJSON ? this.app.toJSON() : this.app,
      state: this.state
    };
  }
}

/**
 * Simple accepts implementation for content negotiation.
 */
function accepts(req) {
  return {
    types: function (...types) {
      if (!types.length) {
        const accept = req.headers.accept;
        return accept ? accept.split(/\s*,\s*/) : [];
      }
      
      const accept = req.headers.accept;
      if (!accept) return types[0];
      
      const accepts = accept.split(/\s*,\s*/).map(a => a.split(';')[0].trim());
      
      for (const type of types) {
        for (const a of accepts) {
          if (type === a || 
              type === '*/*' || 
              a === '*/*' ||
              (type.endsWith('/*') && a.startsWith(type.split('/')[0])) ||
              (a.endsWith('/*') && type.startsWith(a.split('/')[0]))) {
            return type;
          }
        }
      }
      return false;
    }
  };
}
