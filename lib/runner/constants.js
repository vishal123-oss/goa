/**
 * Runner Module Constants
 * Constants specific to middleware runner
 */

/**
 * Runner error messages
 */
export const RUNNER_ERRORS = {
  INVALID_MIDDLEWARE: 'Middleware must be a function',
  NEXT_CALLED_MULTIPLE_TIMES: 'next() called multiple times',
  RUNNER_NOT_INITIALIZED: 'Runner not initialized',
  CONTEXT_REQUIRED: 'Context is required to run middleware'
};

/**
 * Runner configuration defaults
 */
export const RUNNER_CONFIG = {
  silent: false,
  timeout: 30000,
  maxMiddleware: 100
};

/**
 * Runner states
 */
export const RUNNER_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  ERROR: 'error'
};
