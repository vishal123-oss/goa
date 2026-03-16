/**
 * Request Module Utilities
 * Utilities specific to HTTP request handling
 */

import { 
  parseQueryString as sharedParseQueryString, 
  extractPath, 
  extractQueryString, 
  extractHostname, 
  isXhr,
  isBuffer,
  isStream,
  isString
} from '../shared/utils.js';

// Re-export for use in index.js
export { sharedParseQueryString as parseQueryString };

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
  return sharedParseQueryString(qs);
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

/**
 * Parse cookies from request headers
 * @param {Object} headers
 * @returns {Object}
 */
export function parseRequestCookies(headers) {
  const cookies = {};
  const cookieHeader = headers.cookie;
  
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.trim().split('=');
    if (parts.length >= 2) {
      const name = decodeURIComponent(parts[0].trim());
      const value = decodeURIComponent(parts.slice(1).join('=').trim());
      cookies[name] = value;
    }
  });
  
  return cookies;
}

/**
 * Get basic auth credentials from Authorization header
 * @param {Object} headers
 * @returns {Object|null} { username, password } or null
 */
export function getBasicAuth(headers) {
  const auth = headers.authorization;
  if (!auth) return null;
  
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'basic') {
    return null;
  }
  
  try {
    const decoded = Buffer.from(parts[1], 'base64').toString('utf8');
    const [username, password] = decoded.split(':');
    return { username, password };
  } catch (e) {
    return null;
  }
}

/**
 * Get bearer token from Authorization header
 * @param {Object} headers
 * @returns {string|null}
 */
export function getBearerToken(headers) {
  const auth = headers.authorization;
  if (!auth) return null;
  
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Get user agent string
 * @param {Object} headers
 * @returns {string}
 */
export function getUserAgent(headers) {
  return headers['user-agent'] || '';
}

/**
 * Get referer header
 * @param {Object} headers
 * @returns {string}
 */
export function getReferer(headers) {
  return headers.referer || headers.referrer || '';
}

/**
 * Check if request is an upgrade request (WebSocket)
 * @param {Object} headers
 * @returns {boolean}
 */
export function isUpgradeRequest(headers) {
  return headers.upgrade && headers.connection?.toLowerCase().includes('upgrade');
}

/**
 * Get upgrade header
 * @param {Object} headers
 * @returns {string}
 */
export function getUpgradeType(headers) {
  return headers.upgrade || '';
}

/**
 * Parse range header
 * @param {string} rangeHeader
 * @returns {Object|null}
 */
export function parseRange(rangeHeader) {
  if (!rangeHeader) return null;
  
  const parts = rangeHeader.split('=');
  if (parts.length !== 2) return null;
  
  const unit = parts[0].trim();
  const ranges = parts[1].split(',').map(r => {
    const [start, end] = r.trim().split('-').map(n => n ? parseInt(n, 10) : null);
    return { start, end };
  });
  
  return { unit, ranges };
}

/**
 * Check if request expects JSON
 * @param {Object} headers
 * @returns {boolean}
 */
export function expectsJson(headers) {
  const accept = headers.accept || '';
  return accept.includes('application/json');
}

/**
 * Check if request expects HTML
 * @param {Object} headers
 * @returns {boolean}
 */
export function expectsHtml(headers) {
  const accept = headers.accept || '';
  return accept.includes('text/html');
}

/**
 * Get request origin
 * @param {Object} headers
 * @returns {string}
 */
export function getOrigin(headers) {
  return headers.origin || '';
}

/**
 * Check if request is cross-origin
 * @param {Object} headers
 * @param {string} host
 * @returns {boolean}
 */
export function isCrossOrigin(headers, host) {
  const origin = getOrigin(headers);
  if (!origin) return false;
  return !origin.includes(host);
}

/**
 * Read request body as buffer
 * @param {Object} req
 * @returns {Promise<Buffer>}
 */
export function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Parse JSON body
 * @param {Buffer} body
 * @returns {Object}
 */
export function parseJsonBody(body) {
  try {
    return JSON.parse(body.toString('utf8'));
  } catch (e) {
    throw new Error('Invalid JSON body');
  }
}

/**
 * Parse form-urlencoded body
 * @param {Buffer} body
 * @returns {Object}
 */
export function parseFormBody(body) {
  const str = body.toString('utf8');
  return sharedParseQueryString(str);
}

/**
 * Parse multipart body (simplified)
 * @param {Buffer} body
 * @param {string} contentType
 * @returns {Object}
 */
export function parseMultipartBody(body, contentType) {
  // This is a simplified version - full multipart parsing is complex
  const boundary = contentType.match(/boundary=([^;]+)/)?.[1];
  if (!boundary) return {};
  
  const parts = [];
  const boundaryBuffer = Buffer.from('--' + boundary);
  let start = body.indexOf(boundaryBuffer);
  
  while (start !== -1) {
    const end = body.indexOf(boundaryBuffer, start + boundaryBuffer.length);
    const part = body.slice(start + boundaryBuffer.length, end !== -1 ? end : undefined);
    
    // Parse part headers and body
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd !== -1) {
      const headers = part.slice(0, headerEnd).toString('utf8');
      const data = part.slice(headerEnd + 4);
      
      const nameMatch = headers.match(/name="([^"]+)"/);
      const filenameMatch = headers.match(/filename="([^"]+)"/);
      
      if (nameMatch) {
        parts.push({
          name: nameMatch[1],
          filename: filenameMatch?.[1],
          headers,
          data
        });
      }
    }
    
    start = end;
  }
  
  return { parts };
}

/**
 * Auto-detect and parse body based on content-type
 * @param {Buffer} body
 * @param {string} contentType
 * @returns {any}
 */
export function parseBody(body, contentType) {
  if (!body || body.length === 0) return null;
  
  const type = contentType?.toLowerCase() || '';
  
  if (type.includes('application/json')) {
    return parseJsonBody(body);
  }
  
  if (type.includes('application/x-www-form-urlencoded')) {
    return parseFormBody(body);
  }
  
  if (type.includes('multipart/form-data')) {
    return parseMultipartBody(body, contentType);
  }
  
  if (type.includes('text/')) {
    return body.toString('utf8');
  }
  
  // Default: return raw buffer
  return body;
}

/**
 * Get request ID (from header or generate)
 * @param {Object} headers
 * @param {string} headerName
 * @returns {string}
 */
export function getRequestId(headers, headerName = 'x-request-id') {
  return headers[headerName.toLowerCase()] || generateRequestId();
}

/**
 * Generate unique request ID
 * @returns {string}
 */
export function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get request timing info
 * @param {number} startTime
 * @returns {Object}
 */
export function getTimingInfo(startTime) {
  const now = Date.now();
  return {
    startTime,
    elapsed: now - startTime,
    timestamp: new Date(now).toISOString()
  };
}
