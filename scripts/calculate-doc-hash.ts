#!/usr/bin/env node
/**
 * Calculate Documentation Hash
 * 
 * Calculates SHA-256 hash of all documentation content
 * Used to detect if docs changed since last MCP generation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { glob } from 'glob';

function calculateHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function calculateDocumentationHash(): string {
  const docsDir = path.join(process.cwd(), 'docs');
  const pattern = path.join(docsDir, '**/*.md');
  
  const files = glob.sync(pattern, { ignore: ['**/node_modules/**'] })
    .sort(); // Sort for consistency
  
  let allContent = '';
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    allContent += content;
  }
  
  return calculateHash(allContent);
}

// Run if called directly
import { fileURLToPath } from 'url';

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  const hash = calculateDocumentationHash();
  console.log(hash);
  
  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `hash=${hash}\n`);
  }
}

export { calculateDocumentationHash };

