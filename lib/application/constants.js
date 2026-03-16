/**
 * Application Module Constants
 * Constants specific to application/core handling
 */

import { DEFAULT_APP_OPTIONS } from '../shared/constants.js';

/**
 * Re-export default app options from shared
 */
export { DEFAULT_APP_OPTIONS };

/**
 * Application events
 */
export const APP_EVENTS = {
  ERROR: 'error',
  LISTENING: 'listening',
  CLOSE: 'close',
  REQUEST: 'request'
};

/**
 * Application configuration
 */
export const APP_CONFIG = {
  DEFAULT_PORT: 3000,
  DEFAULT_HOST: '0.0.0.0',
  MAX_MIDDLEWARE_COUNT: 1000
};

/**
 * Application states
 */
export const APP_STATES = {
  INITIALIZING: 'initializing',
  READY: 'ready',
  LISTENING: 'listening',
  CLOSING: 'closing',
  CLOSED: 'closed',
  ERROR: 'error'
};

/**
 * Error messages
 */
export const APP_ERRORS = {
  MIDDLEWARE_NOT_FUNCTION: 'middleware must be a function!',
  INVALID_OPTIONS: 'invalid application options',
  ALREADY_STARTED: 'application already started',
  NOT_STARTED: 'application not started'
};
