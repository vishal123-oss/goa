/**
 * Goa Framework
 * A minimal, expressive HTTP middleware framework for Node.js
 * Inspired by Koa
 */

import Application from './lib/application.js';
import Context from './lib/context.js';
import Request from './lib/request.js';
import Response from './lib/response.js';
import { compose } from './lib/compose.js';

// Export Application as default
export default Application;

// Named exports for individual components
export {
  Application,
  Context,
  Request,
  Response,
  compose
};
