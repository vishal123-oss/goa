/**
 * Build script to create CommonJS version for compatibility
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

// Create CJS index
const cjsContent = `'use strict';

const Application = require('./lib/application');
const Context = require('./lib/context');
const Request = require('./lib/request');
const Response = require('./lib/response');
const compose = require('./lib/compose');

function Goa(options) {
  return new Application(options);
}

Goa.Application = Application;
Goa.Context = Context;
Goa.Request = Request;
Goa.Response = Response;
Goa.compose = compose;

module.exports = Goa;
`;

fs.writeFileSync(path.join(distDir, 'index.cjs'), cjsContent);

// Create CJS versions of lib files
const libDir = path.join(distDir, 'lib');
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

// Convert ESM to CJS for lib files
const libFiles = ['application.js', 'context.js', 'request.js', 'response.js', 'compose.js'];

for (const file of libFiles) {
  const esmPath = path.join(rootDir, 'lib', file);
  const cjsPath = path.join(libDir, file);
  
  if (fs.existsSync(esmPath)) {
    let content = fs.readFileSync(esmPath, 'utf8');
    
    // Simple ESM to CJS conversion
    content = content
      .replace(/^import\s+(.+)\s+from\s+['"](.+?)['"];?\s*$/gm, (match, imports, module) => {
        // Handle default imports
        if (imports.startsWith('{')) {
          return `const ${imports} = require('${module}');`;
        }
        return `const ${imports} = require('${module}').default || require('${module}');`;
      })
      .replace(/^export\s+default\s+(.+)$/gm, 'module.exports = $1;')
      .replace(/^export\s+function\s+(.+)$/gm, 'exports.$1 = function $1')
      .replace(/^export\s+const\s+(\w+)\s*=\s*(.+)$/gm, 'exports.$1 = $2;')
      .replace(/^export\s+\{(.+)\};?$/gm, (match, exports) => {
        return exports.split(',').map(e => {
          const trimmed = e.trim();
          return `exports.${trimmed} = ${trimmed};`;
        }).join('\n');
      });
    
    fs.writeFileSync(cjsPath, content);
  }
}

console.log('CJS build complete!');
