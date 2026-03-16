/**
 * Context Module Constants
 * Constants specific to context handling
 */

/**
 * Context property delegations
 * Maps context property to request/response property
 */
export const CONTEXT_DELEGATIONS = {
  // From request
  method: { target: 'request', writable: true },
  url: { target: 'request', writable: true },
  path: { target: 'request', writable: true },
  querystring: { target: 'request', writable: true },
  query: { target: 'request' },
  headers: { target: 'request' },
  protocol: { target: 'request' },
  secure: { target: 'request' },
  hostname: { target: 'request' },
  host: { target: 'request' },
  xhr: { target: 'request' },
  fresh: { target: 'request' },
  stale: { target: 'request' },
  idempotent: { target: 'request' },
  
  // From response
  status: { target: 'response', writable: true },
  message: { target: 'response', writable: true },
  body: { target: 'response', writable: true },
  length: { target: 'response', writable: true },
  type: { target: 'response', writable: true },
  lastModified: { target: 'response', writable: true },
  etag: { target: 'response', writable: true },
  headerSent: { target: 'response' },
  writable: { target: 'response' }
};

/**
 * Context error codes
 */
export const CONTEXT_ERRORS = {
  INVALID_CONTEXT: 'Invalid context state',
  MISSING_REQUEST: 'Request object not set',
  MISSING_RESPONSE: 'Response object not set'
};

/**
 * Default context options
 */
export const CONTEXT_CONFIG = {
  respond: true,
  silent: false
};
