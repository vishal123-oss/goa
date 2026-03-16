/**
 * Compose Module Constants
 * Constants specific to middleware composition
 */

/**
 * Error messages for compose module
 */
export const COMPOSE_ERRORS = {
  MIDDLEWARE_NOT_ARRAY: 'Middleware stack must be an array!',
  MIDDLEWARE_NOT_FUNCTION: 'Middleware must be composed of functions!',
  NEXT_CALLED_MULTIPLE_TIMES: 'next() called multiple times'
};

/**
 * Compose module configuration
 */
export const COMPOSE_CONFIG = {
  MAX_STACK_SIZE: 1000,
  ALLOW_EMPTY_MIDDLEWARE: true
};

/**
 * Middleware execution states
 */
export const MIDDLEWARE_STATES = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  ERROR: 'error'
};
