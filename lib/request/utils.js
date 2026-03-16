/**
 * Request Module Utilities
 * Utilities specific to HTTP request handling
 */

import { parseQueryString, extractPath, extractQueryString, extractHostname, isXhr } from '../shared/utils.js';
import { HEADER_ALIASES, PROTOCOLS, HTTP_METHODS } from './constants.js';
import { IDEMPOTENT_METHODS } from '../shared/constants.js';

/**
 * Get header value with alias handling
 * @param {Object} headers
 * @param {string} field
 * @returns {string}
 */
export function getHeader(headers, field) {
  const key = field.toLowerCase();
  const alias = HEADER_ALIASES[key];
  
  if (alias && alias !== key) {
    return headers[alias] || headers[key] || '';
  }
  
  return headers[key] || '';
}

/**
 * Get all headers
 * @param {Object} req
 * @returns {Object}
 */
export function getAllHeaders(req) {
  return req.headers || {};
}

/**
 * Get request protocol
 * @param {Object} req
 * @param {Object} socket
 * @returns {string}
 */
export function getProtocol(req, socket) {
  if (socket?.encrypted) return PROTOCOLS.HTTPS;
  return PROTOCOLS.HTTP;
}

/**
 * Check if request is secure
 * @param {Object} req
 * @param {Object} socket
 * @returns {boolean}
 */
export function isSecure(req, socket) {
  return getProtocol(req, socket) === PROTOCOLS.HTTPS;
}

/**
 * Get request path from URL
 * @param {string} url
 * @returns {string}
 */
export function getPath(url) {
  return extractPath(url);
}

/**
 * Get query string from URL
 * @param {string} url
 * @returns {string}
 */
export function getQueryString(url) {
  return extractQueryString(url);
}

/**
 * Get parsed query object from URL
 * @param {string} url
 * @returns {Object}
 */
export function getQuery(url) {
  const qs = extractQueryString(url);
  return parseQueryString(qs);
}

/**
 * Get hostname from host header
 * @param {Object} headers
 * @returns {string|undefined}
 */
export function getHostname(headers) {
  const host = headers.host;
  return extractHostname(host);
}

/**
 * Get host header value
 * @param {Object} headers
 * @returns {string|undefined}
 */
export function getHost(headers) {
  return headers.host;
}

/**
 * Check if request is XMLHttpRequest
 * @param {Object} headers
 * @returns {boolean}
 */
export function isXMLHttpRequest(headers) {
  return isXhr(headers['x-requested-with']);
}

/**
 * Check if request is idempotent
 * @param {string} method
 * @returns {boolean}
 */
export function isIdempotentMethod(method) {
  return IDEMPOTENT_METHODS.includes(method);
}

/**
 * Check request freshness
 * @param {Object} req
 * @param {number} statusCode
 * @returns {boolean}
 */
export function isFresh(req, statusCode) {
  const method = req.method;
  
  // GET or HEAD only for freshness validation
  if (method !== HTTP_METHODS.GET && method !== HTTP_METHODS.HEAD) {
    return false;
  }
  
  // 2xx or 304 status codes
  if ((statusCode >= 200 && statusCode < 300) || statusCode === 304) {
    // This would need more logic with cache headers
    return false; // Simplified
  }
  
  return false;
}

/**
 * Get content length from headers
 * @param {Object} headers
 * @returns {number|undefined}
 */
export function getContentLength(headers) {
  const len = headers['content-length'];
  if (!len) return undefined;
  return parseInt(len, 10);
}

/**
 * Get content type without charset
 * @param {Object} headers
 * @returns {string}
 */
export function getContentType(headers) {
  const type = headers['content-type'];
  if (!type) return '';
  return type.split(';')[0].trim();
}

/**
 * Get charset from content-type header
 * @param {Object} headers
 * @returns {string|undefined}
 */
export function getCharset(headers) {
  const contentType = headers['content-type'];
  if (!contentType) return undefined;
  const match = /charset=([^;]+)/i.exec(contentType);
  return match ? match[1].trim() : undefined;
}

/**
 * Get accept header
 * @param {Object} headers
 * @returns {string}
 */
export function getAcceptHeader(headers) {
  return headers.accept || '';
}

/**
 * Get request socket reference
 * @param {Object} req
 * @returns {Object}
 */
export function getSocket(req) {
  return req.socket;
}

/**
 * Get original URL
 * @param {Object} req
 * @returns {string}
 */
export function getOriginalUrl(req) {
  return req.url;
}
