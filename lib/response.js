/**
 * Response abstraction for Goa framework.
 * Wraps the native Node.js ServerResponse.
 */
export default class Response {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.app = null;
    this.ctx = null;
    this._body = undefined;
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
    if (this.headerSent) return;
    this.res.statusCode = code;
    if (this.req.httpVersionMajor < 2) {
      this.res.statusMessage = Response.STATUS_CODES[code] || '';
    }
    if (this.body && Response.empty[code]) {
      this.body = null;
    }
  }

  /**
   * Get response status message.
   * @returns {string}
   */
  get message() {
    return this.res.statusMessage || Response.STATUS_CODES[this.res.statusCode] || '';
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

    // no content
    if (val == null) {
      if (!Response.empty[this.status]) this.status = 204;
      return;
    }

    // status body
    if (!this._explicitStatus) this.status = 200;

    // set the content-type only if not yet set
    const setType = !this.header['content-type'];

    // string
    if (typeof val === 'string') {
      if (setType) this.type = /^\s*</.test(val) ? 'text/html' : 'text/plain';
      this.length = Buffer.byteLength(val);
      return;
    }

    // buffer
    if (Buffer.isBuffer(val)) {
      if (setType) this.type = 'application/octet-stream';
      this.length = val.length;
      return;
    }

    // stream
    if (typeof val.pipe === 'function') {
      if (setType) this.type = 'application/octet-stream';
      return;
    }

    // json
    this.type = 'application/json';
    this.length = Buffer.byteLength(JSON.stringify(val));
  }

  /**
   * Get response length.
   * @returns {number|undefined}
   */
  get length() {
    const len = this.header['content-length'];
    if (len === undefined) return undefined;
    return parseInt(len, 10);
  }

  /**
   * Set response length.
   * @param {number} n
   */
  set length(n) {
    this.set('Content-Length', n);
  }

  /**
   * Get response header.
   * @param {string} field
   * @returns {string|undefined}
   */
  get(field) {
    return this.header[field.toLowerCase()];
  }

  /**
   * Set response header.
   * @param {string} field
   * @param {string} val
   */
  set(field, val) {
    if (this.headerSent) return;
    this.res.setHeader(field, val);
  }

  /**
   * Append response header.
   * @param {string} field
   * @param {string|string[]} val
   */
  append(field, val) {
    const prev = this.get(field);
    if (prev) {
      val = Array.isArray(prev) ? prev.concat(val) : [prev].concat(val);
    }
    return this.set(field, val);
  }

  /**
   * Remove response header.
   * @param {string} field
   */
  remove(field) {
    if (this.headerSent) return;
    this.res.removeHeader(field);
  }

  /**
   * Get all response headers.
   * @returns {Object}
   */
  get header() {
    return this.res.getHeaders();
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
    type = getType(type);
    if (type) {
      this.set('Content-Type', type);
    }
  }

  /**
   * Check if response headers have been sent.
   * @returns {boolean}
   */
  get headerSent() {
    return this.res.headersSent;
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
    if (typeof val === 'string') val = new Date(val);
    this.set('Last-Modified', val.toUTCString());
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
    if (!/^(W\/)?"/.test(val)) val = `"${val}"`;
    this.set('ETag', val);
  }

  /**
   * Vary response header.
   * @param {string} field
   */
  vary(field) {
    vary(this.res, field);
  }

  /**
   * Redirect to url.
   * @param {string} url
   * @param {string} [alt]
   */
  redirect(url, alt) {
    // location
    if ('back' === url) url = this.ctx.get('Referrer') || alt || '/';
    this.set('Location', url);

    // status
    if (!Response.redirect[this.status]) this.status = 302;

    // body
    if (this.ctx.accepts('html')) {
      url = escape(url);
      this.type = 'text/html; charset=utf-8';
      this.body = `Redirecting to <a href="${url}">${url}</a>.`;
    } else {
      this.type = 'text/plain; charset=utf-8';
      this.body = `Redirecting to ${url}.`;
    }
  }

  /**
   * Set Content-Disposition header.
   * @param {string} [filename]
   * @param {Object} [options]
   */
  attachment(filename, options) {
    if (filename) this.type = extname(filename);
    this.set('Content-Disposition', contentDisposition(filename, options));
  }

  /**
   * Check if response is writable.
   * @returns {boolean}
   */
  get writable() {
    if (this.res.finished) return false;
    const socket = this.res.socket;
    if (!socket) return true;
    return socket.writable;
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
    this.res.flushHeaders();
  }

  /**
   * HTTP status codes
   */
  static STATUS_CODES = {
    100: 'Continue',
    101: 'Switching Protocols',
    102: 'Processing',
    103: 'Early Hints',
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    207: 'Multi-Status',
    208: 'Already Reported',
    226: 'IM Used',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    305: 'Use Proxy',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Payload Too Large',
    414: 'URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Range Not Satisfiable',
    417: 'Expectation Failed',
    418: 'I\'m a teapot',
    421: 'Misdirected Request',
    422: 'Unprocessable Entity',
    423: 'Locked',
    424: 'Failed Dependency',
    425: 'Too Early',
    426: 'Upgrade Required',
    428: 'Precondition Required',
    429: 'Too Many Requests',
    431: 'Request Header Fields Too Large',
    451: 'Unavailable For Legal Reasons',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates',
    507: 'Insufficient Storage',
    508: 'Loop Detected',
    510: 'Not Extended',
    511: 'Network Authentication Required'
  };

  static empty = {
    204: true,
    205: true,
    304: true
  };

  static redirect = {
    300: true,
    301: true,
    302: true,
    303: true,
    307: true,
    308: true
  };
}

/**
 * Simple content-type lookup
 */
function getType(type) {
  const types = {
    html: 'text/html',
    json: 'application/json',
    text: 'text/plain',
    urlencoded: 'application/x-www-form-urlencoded',
    multipart: 'multipart/form-data'
  };
  
  if (type.includes('/')) return type;
  return types[type] || type;
}

function extname(filename) {
  const index = filename.lastIndexOf('.');
  return index === -1 ? '' : filename.substring(index + 1);
}

function escape(html) {
  return html
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function vary(res, field) {
  let val = res.getHeader('Vary') || '';
  if (val) val += ', ';
  val += field;
  res.setHeader('Vary', val);
}

function contentDisposition(filename, options) {
  if (!filename) return 'attachment';
  return `attachment; filename="${filename}"`;
}
