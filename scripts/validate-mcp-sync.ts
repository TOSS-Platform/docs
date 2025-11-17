#!/usr/bin/env node
/**
 * Validate MCP Sync
 * 
 * Ensures MCP resources are in sync with documentation
 * Prevents deployment of out-of-sync MCP
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { calculateDocumentationHash } from './calculate-doc-hash.js';
import { glob } from 'glob';

interface MCPVersion {
  version: string;
  generatedAt: string;
  documentationHash: string;
  resourceCount: number;
  toolCount: number;
  lastSync: string;
}

function validateMCPSync(): boolean {
  console.log('🔍 Validating MCP sync...\n');
  
  // Calculate current documentation hash
  const currentHash = calculateDocumentationHash();
  console.log(`📄 Current documentation hash: ${currentHash.substring(0, 16)}...`);
  
  // Read MCP version
  const versionPath = path.join(process.cwd(), 'mcp-version.json');
  
  if (!fs.existsSync(versionPath)) {
    console.error('❌ mcp-version.json not found!');
    console.error('   Run: npm run generate-mcp\n');
    return false;
  }
  
  const mcpVersion: MCPVersion = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  console.log(`📦 MCP documentation hash: ${mcpVersion.documentationHash.substring(0, 16)}...`);
  
  // Compare hashes
  if (currentHash !== mcpVersion.documentationHash) {
    console.error('\n❌ MCP OUT OF SYNC!\n');
    console.error('Documentation has changed since MCP was last generated.\n');
    console.error('To fix:');
    console.error('  npm run generate-mcp\n');
    return false;
  }
  
  // Validate resource count
  const docsDir = path.join(process.cwd(), 'docs');
  const docFiles = glob.sync(path.join(docsDir, '**/*.md'), {
    ignore: ['**/node_modules/**']
  });
  
  if (docFiles.length !== mcpVersion.resourceCount) {
    console.error('\n⚠️  Resource count mismatch!');
    console.error(`   Docs: ${docFiles.length}, MCP: ${mcpVersion.resourceCount}\n`);
    console.error('   Run: npm run generate-mcp\n');
    return false;
  }
  
  // Check manifest exists
  const manifestPath = path.join(process.cwd(), 'mcp-resources.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ mcp-resources.json not found!\n');
    return false;
  }
  
  console.log(`\n✅ MCP is IN SYNC`);
  console.log(`   Version: ${mcpVersion.version}`);
  console.log(`   Resources: ${mcpVersion.resourceCount}`);
  console.log(`   Tools: ${mcpVersion.toolCount}`);
  console.log(`   Last Sync: ${mcpVersion.lastSync}\n`);
  
  return true;
}

// Run if called directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  const isValid = validateMCPSync();
  process.exit(isValid ? 0 : 1);
}

export { validateMCPSync };
