/**
 * Response Module Constants
 * Constants specific to HTTP response handling
 */

import { HTTP_STATUS_MESSAGES } from '../shared/constants.js';

/**
 * Export status messages from shared
 */
export { HTTP_STATUS_MESSAGES };

/**
 * Content type mappings (short name to full MIME type)
 */
export const CONTENT_TYPE_MAP = {
  html: 'text/html',
  json: 'application/json',
  text: 'text/plain',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  multipart: 'multipart/form-data',
  stream: 'application/octet-stream',
  binary: 'application/octet-stream',
  js: 'application/javascript',
  css: 'text/css',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon'
};

/**
 * Response configuration defaults
 */
export const RESPONSE_CONFIG = {
  DEFAULT_STATUS: 200,
  DEFAULT_TYPE: 'text/plain',
  DEFAULT_CHARSET: 'utf-8'
};

/**
 * Response state flags
 */
export const RESPONSE_STATES = {
  PENDING: 'pending',
  HEADERS_SENT: 'headers_sent',
  FINISHED: 'finished',
  ERROR: 'error'
};
