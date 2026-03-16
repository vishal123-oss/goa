/**
 * Response Module Utilities
 * Utilities specific to HTTP response handling
 */

import { isString, isBuffer, isStream, looksLikeHtml, escapeHtml, getExtension, formatHttpDate } from '../shared/utils.js';
import { CONTENT_TYPE_MAP, HTTP_STATUS_MESSAGES } from './constants.js';
import { STATUS_CODES_WITHOUT_BODY, REDIRECT_STATUS_CODES, CONTENT_TYPES } from '../shared/constants.js';

/**
 * Get status message for status code
 * @param {number} code
 * @returns {string}
 */
export function getStatusMessage(code) {
  return HTTP_STATUS_MESSAGES[code] || '';
}

/**
 * Check if status code should not have body
 * @param {number} code
 * @returns {boolean}
 */
export function shouldNotHaveBody(code) {
  return !!STATUS_CODES_WITHOUT_BODY[code];
}

/**
 * Check if status code is a redirect
 * @param {number} code
 * @returns {boolean}
 */
export function isRedirectStatus(code) {
  return !!REDIRECT_STATUS_CODES[code];
}

/**
 * Get full MIME type from shorthand
 * @param {string} type
 * @returns {string}
 */
export function getMimeType(type) {
  if (!type) return '';
  if (type.includes('/')) return type;
  return CONTENT_TYPE_MAP[type] || type;
}

/**
 * Get content type for body value
 * @param {any} body
 * @returns {string}
 */
export function getTypeForBody(body) {
  if (isBuffer(body)) return CONTENT_TYPES.OCTET_STREAM;
  if (isStream(body)) return CONTENT_TYPES.OCTET_STREAM;
  if (isString(body)) {
    return looksLikeHtml(body) ? CONTENT_TYPES.HTML : CONTENT_TYPES.TEXT;
  }
  return CONTENT_TYPES.JSON;
}

/**
 * Calculate content length for body
 * @param {any} body
 * @returns {number|undefined}
 */
export function calculateContentLength(body) {
  if (body == null) return undefined;
  if (isBuffer(body)) return body.length;
  if (isString(body)) return Buffer.byteLength(body);
  if (isStream(body)) return undefined;
  return Buffer.byteLength(JSON.stringify(body));
}

/**
 * Set response header safely
 * @param {Object} res
 * @param {string} field
 * @param {string} value
 */
export function setHeader(res, field, value) {
  if (res.headersSent) return;
  res.setHeader(field, value);
}

/**
 * Get response header value
 * @param {Object} res
 * @param {string} field
 * @returns {string|undefined}
 */
export function getHeader(res, field) {
  const headers = res.getHeaders ? res.getHeaders() : {};
  return headers[field.toLowerCase()];
}

/**
 * Append to existing header
 * @param {Object} res
 * @param {string} field
 * @param {string|string[]} value
 */
export function appendHeader(res, field, value) {
  if (res.headersSent) return;
  
  const headers = res.getHeaders ? res.getHeaders() : {};
  const prev = headers[field.toLowerCase()];
  
  if (prev) {
    value = Array.isArray(prev) ? prev.concat(value) : [prev].concat(value);
  }
  
  res.setHeader(field, value);
}

/**
 * Remove response header
 * @param {Object} res
 * @param {string} field
 */
export function removeHeader(res, field) {
  if (res.headersSent) return;
  res.removeHeader(field);
}

/**
 * Get all response headers
 * @param {Object} res
 * @returns {Object}
 */
export function getAllHeaders(res) {
  return res.getHeaders ? res.getHeaders() : {};
}

/**
 * Check if response headers have been sent
 * @param {Object} res
 * @returns {boolean}
 */
export function isHeadersSent(res) {
  return res.headersSent;
}

/**
 * Check if response is writable
 * @param {Object} res
 * @returns {boolean}
 */
export function isWritable(res) {
  if (res.finished) return false;
  const socket = res.socket;
  if (!socket) return true;
  return socket.writable;
}

/**
 * Format redirect URL
 * @param {string} url
 * @param {string} referer
 * @param {string} fallback
 * @returns {string}
 */
export function formatRedirectUrl(url, referer, fallback = '/') {
  if (url === 'back') {
    return referer || fallback || '/';
  }
  return url;
}

/**
 * Create redirect body
 * @param {string} url
 * @param {boolean} acceptsHtml
 * @returns {Object} { body, type }
 */
export function createRedirectBody(url, acceptsHtml) {
  if (acceptsHtml) {
    const escaped = escapeHtml(url);
    return {
      body: `Redirecting to <a href="${escaped}">${escaped}</a>.`,
      type: 'text/html; charset=utf-8'
    };
  }
  return {
    body: `Redirecting to ${url}.`,
    type: 'text/plain; charset=utf-8'
  };
}

/**
 * Create content disposition header value
 * @param {string} filename
 * @param {Object} options
 * @returns {string}
 */
export function createContentDisposition(filename, options = {}) {
  if (!filename) return 'attachment';
  return `attachment; filename="${filename}"`;
}

/**
 * Format ETag value
 * @param {string} val
 * @returns {string}
 */
export function formatEtag(val) {
  if (!val) return val;
  if (!/^(W\/)?"/.test(val)) {
    val = `"${val}"`;
  }
  return val;
}

/**
 * Set vary header
 * @param {Object} res
 * @param {string} field
 */
export function setVaryHeader(res, field) {
  const headers = res.getHeaders ? res.getHeaders() : {};
  let val = headers.vary || '';
  if (val) val += ', ';
  val += field;
  res.setHeader('Vary', val);
}

/**
 * Flush headers to response
 * @param {Object} res
 */
export function flushHeaders(res) {
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
}

/**
 * End response with body
 * @param {Object} res
 * @param {any} body
 */
export function endResponse(res, body) {
  if (isBuffer(body) || isString(body)) {
    res.end(body);
  } else if (isStream(body)) {
    body.pipe(res);
  } else {
    res.end(JSON.stringify(body));
  }
}
