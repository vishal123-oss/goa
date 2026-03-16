/**
 * Shared Utilities
 * Utility functions used across all Goa framework modules
 */

/**
 * Check if a value is a function
 * @param {any} val
 * @returns {boolean}
 */
export function isFunction(val) {
  return typeof val === 'function';
}

/**
 * Check if a value is an async function
 * @param {any} val
 * @returns {boolean}
 */
export function isAsyncFunction(val) {
  return val && val.constructor && val.constructor.name === 'AsyncFunction';
}

/**
 * Check if a value is a string
 * @param {any} val
 * @returns {boolean}
 */
export function isString(val) {
  return typeof val === 'string';
}

/**
 * Check if a value is a number
 * @param {any} val
 * @returns {boolean}
 */
export function isNumber(val) {
  return typeof val === 'number' && !isNaN(val);
}

/**
 * Check if a value is an object (not null, not array)
 * @param {any} val
 * @returns {boolean}
 */
export function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

/**
 * Check if a value is a Buffer
 * @param {any} val
 * @returns {boolean}
 */
export function isBuffer(val) {
  return Buffer.isBuffer(val);
}

/**
 * Check if a value is a stream (has pipe method)
 * @param {any} val
 * @returns {boolean}
 */
export function isStream(val) {
  return val !== null && typeof val === 'object' && typeof val.pipe === 'function';
}

/**
 * Check if a value is a Promise
 * @param {any} val
 * @returns {boolean}
 */
export function isPromise(val) {
  return val !== null && typeof val === 'object' && typeof val.then === 'function';
}

/**
 * Check if value looks like HTML
 * @param {string} str
 * @returns {boolean}
 */
export function looksLikeHtml(str) {
  return /^\s*</.test(str);
}

/**
 * Get file extension from filename
 * @param {string} filename
 * @returns {string}
 */
export function getExtension(filename) {
  if (!filename) return '';
  const index = filename.lastIndexOf('.');
  return index === -1 ? '' : filename.substring(index + 1);
}

/**
 * Escape HTML special characters
 * @param {string} html
 * @returns {string}
 */
export function escapeHtml(html) {
  if (!isString(html)) return html;
  return html
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Parse content type to get type without charset
 * @param {string} contentType
 * @returns {string}
 */
export function parseContentType(contentType) {
  if (!contentType) return '';
  return contentType.split(';')[0].trim();
}

/**
 * Parse charset from content type header
 * @param {string} contentType
 * @returns {string|undefined}
 */
export function parseCharset(contentType) {
  if (!contentType) return undefined;
  const match = /charset=([^;]+)/i.exec(contentType);
  return match ? match[1].trim() : undefined;
}

/**
 * Get content length for a body value
 * @param {any} body
 * @returns {number|undefined}
 */
export function getContentLength(body) {
  if (body == null) return undefined;
  if (isBuffer(body)) return body.length;
  if (isString(body)) return Buffer.byteLength(body);
  if (isStream(body)) return undefined;
  return Buffer.byteLength(JSON.stringify(body));
}

/**
 * Normalize header field name (lowercase)
 * @param {string} field
 * @returns {string}
 */
export function normalizeHeaderField(field) {
  return field.toLowerCase();
}

/**
 * Create a simple accepts checker for content negotiation
 * @param {string} acceptHeader
 * @returns {Object}
 */
export function createAcceptsChecker(acceptHeader) {
  return {
    types(...types) {
      if (!types.length) {
        return acceptHeader ? acceptHeader.split(/\s*,\s*/) : [];
      }

      if (!acceptHeader) return types[0];

      const accepts = acceptHeader.split(/\s*,\s*/).map(a => a.split(';')[0].trim());

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

/**
 * Parse query string to object
 * @param {string} querystring
 * @returns {Object}
 */
export function parseQueryString(querystring) {
  if (!querystring) return {};
  const urlSearchParams = new URLSearchParams(querystring);
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
 * Extract path from URL (without query string)
 * @param {string} url
 * @returns {string}
 */
export function extractPath(url) {
  if (!url) return '';
  const index = url.indexOf('?');
  return index === -1 ? url : url.substring(0, index);
}

/**
 * Extract query string from URL
 * @param {string} url
 * @returns {string}
 */
export function extractQueryString(url) {
  if (!url) return '';
  const index = url.indexOf('?');
  return index === -1 ? '' : url.substring(index + 1);
}

/**
 * Extract hostname from host header (removes port)
 * @param {string} host
 * @returns {string|undefined}
 */
export function extractHostname(host) {
  if (!host) return undefined;
  // IPv6
  if (host.startsWith('[')) {
    return host.substring(1, host.indexOf(']'));
  }
  return host.split(':')[0];
}

/**
 * Check if request is XMLHttpRequest
 * @param {string} headerValue
 * @returns {boolean}
 */
export function isXhr(headerValue) {
  return (headerValue || '').toLowerCase() === 'xmlhttprequest';
}

/**
 * Get client IP from request
 * @param {Object} socket
 * @param {Object} headers
 * @param {boolean} proxy
 * @param {string} proxyIpHeader
 * @returns {string}
 */
export function getClientIp(socket, headers, proxy, proxyIpHeader) {
  if (proxy) {
    const val = headers[proxyIpHeader.toLowerCase()];
    if (val) {
      return val.split(/\s*,\s*/)[0];
    }
  }
  return socket?.remoteAddress || '';
}

/**
 * Get all IPs from X-Forwarded-For header
 * @param {Object} headers
 * @param {boolean} proxy
 * @param {string} proxyIpHeader
 * @returns {string[]}
 */
export function getClientIps(headers, proxy, proxyIpHeader) {
  if (!proxy) return [];
  const val = headers[proxyIpHeader.toLowerCase()];
  return val ? val.split(/\s*,\s*/) : [];
}

/**
 * Extract subdomains from hostname
 * @param {string} hostname
 * @param {number} subdomainOffset
 * @returns {string[]}
 */
export function extractSubdomains(hostname, subdomainOffset) {
  if (!hostname) return [];
  return hostname.split('.').reverse().slice(subdomainOffset);
}

/**
 * Format HTTP date
 * @param {Date|string} date
 * @returns {string}
 */
export function formatHttpDate(date) {
  if (isString(date)) date = new Date(date);
  return date.toUTCString();
}

/**
 * Create error with status code
 * @param {number} status
 * @param {string} message
 * @param {Object} props
 * @returns {Error}
 */
export function createHttpError(status, message, props) {
  const err = new Error(message || 'Error');
  err.expose = true;
  err.status = status;
  err.statusCode = status;
  if (props) Object.assign(err, props);
  return err;
}

/**
 * Deep clone a simple object
 * @param {Object} obj
 * @returns {Object}
 */
export function clone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(clone);
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = clone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Merge objects deeply
 * @param {...Object} objects
 * @returns {Object}
 */
export function merge(...objects) {
  const result = {};
  for (const obj of objects) {
    if (!obj) continue;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (isObject(result[key]) && isObject(obj[key])) {
          result[key] = merge(result[key], obj[key]);
        } else {
          result[key] = obj[key];
        }
      }
    }
  }
  return result;
}

/**
 * Debounce function
 * @param {Function} fn
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(fn, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Throttle function
 * @param {Function} fn
 * @param {number} limit
 * @returns {Function}
 */
export function throttle(fn, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
