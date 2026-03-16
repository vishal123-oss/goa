/**
 * Goa Framework
 * A minimal, expressive HTTP middleware framework for Node.js
 * Inspired by Koa
 *
 * Modular Architecture:
 * - lib/shared/     : Shared utilities and constants
 * - lib/compose/    : Middleware composition
 * - lib/request/    : HTTP request abstraction
 * - lib/response/   : HTTP response abstraction
 * - lib/context/    : Request/response context
 * - lib/application/: Application core
 * - lib/runner/     : Synchronous middleware runner
 */

// Core Classes
import Application from './lib/application/index.js';
import Context from './lib/context/index.js';
import Request from './lib/request/index.js';
import Response from './lib/response/index.js';

// Compose function
import { compose } from './lib/compose/index.js';

// Runner for middleware management
import Runner from './lib/runner/index.js';

// Shared utilities and constants
export * from './lib/shared/utils.js';
export * from './lib/shared/constants.js';

// Module-specific exports
export * from './lib/compose/index.js';
export * from './lib/compose/utils.js';
export * from './lib/compose/constants.js';

export * from './lib/request/index.js';
export * from './lib/request/utils.js';
export * from './lib/request/constants.js';

export * from './lib/response/index.js';
export * from './lib/response/utils.js';
export * from './lib/response/constants.js';

export * from './lib/context/index.js';
export * from './lib/context/utils.js';
export * from './lib/context/constants.js';

export * from './lib/application/index.js';
export * from './lib/application/utils.js';
export * from './lib/application/constants.js';

// Runner exports
export * from './lib/runner/index.js';
export * from './lib/runner/utils.js';
export * from './lib/runner/constants.js';

// Export Application as default (main entry point)
export default Application;

// Named exports for individual components
export {
  Application,
  Context,
  Request,
  Response,
  compose,
  Runner
};
