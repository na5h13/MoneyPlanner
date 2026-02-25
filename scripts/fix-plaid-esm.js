#!/usr/bin/env node
// Patches react-native-plaid-link-sdk ESM imports to include .js extensions
// Required because the SDK uses bare specifiers (./PlaidLink) without .js,
// which fails under Node's strict ESM resolution.

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'node_modules', 'react-native-plaid-link-sdk', 'dist');

if (!fs.existsSync(distDir)) {
  console.log('Plaid SDK not installed, skipping patch');
  process.exit(0);
}

let patched = 0;

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix relative imports missing .js extension
  // Matches: from './Foo' or from '../Foo' but not from './Foo.js'
  content = content.replace(
    /from\s+['"](\.[^'"]+)(?<!\.js)(?<!\.json)(?<!\.node)['"]/g,
    (match, importPath) => {
      // Don't patch if it already has an extension
      if (/\.\w+$/.test(importPath) && !importPath.endsWith('/')) return match;
      // Check if the .js file exists
      const resolved = path.resolve(path.dirname(filePath), importPath + '.js');
      if (fs.existsSync(resolved)) {
        patched++;
        return match.replace(importPath, importPath + '.js');
      }
      return match;
    }
  );

  // Also fix: import { ... } from './Foo' (export form)
  content = content.replace(
    /export\s+\*\s+from\s+['"](\.[^'"]+)(?<!\.js)(?<!\.json)['"]/g,
    (match, importPath) => {
      const resolved = path.resolve(path.dirname(filePath), importPath + '.js');
      if (fs.existsSync(resolved)) {
        patched++;
        return match.replace(importPath, importPath + '.js');
      }
      return match;
    }
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

// Patch all .js files in dist
function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.js')) {
      patchFile(fullPath);
    }
  }
}

walkDir(distDir);
console.log(`Patched ${patched} Plaid SDK ESM imports`);
