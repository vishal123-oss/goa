/**
 * Request Module Constants
 * Constants specific to HTTP request handling
 */

/**
 * Common HTTP methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
  TRACE: 'TRACE',
  CONNECT: 'CONNECT'
};

/**
 * Header field aliases (lowercase to canonical)
 */
export const HEADER_ALIASES = {
  'referer': 'referer',
  'referrer': 'referer'
};

/**
 * Protocol types
 */
export const PROTOCOLS = {
  HTTP: 'http',
  HTTPS: 'https',
  HTTP2: 'http2',
  WEBSOCKET: 'ws',
  WEBSOCKET_SECURE: 'wss'
};

/**
 * Request state flags
 */
export const REQUEST_STATES = {
  FRESH: 'fresh',
  STALE: 'stale',
  IDEMPOTENT: 'idempotent'
};

/**
 * Default request configuration
 */
export const REQUEST_CONFIG = {
  DEFAULT_PROTOCOL: 'http',
  TRUST_PROXY: false,
  MAX_URL_LENGTH: 8192
};
