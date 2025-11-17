#!/usr/bin/env node
/**
 * Generate MCP Resources from Documentation
 * 
 * Scans all documentation and creates MCP resource manifest
 * Run: npm run generate-mcp
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { glob } from 'glob';

interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  contentHash: string;
  lastModified: string;
  size: number;
  category: string;
  tags: string[];
}

interface MCPTool {
  name: string;
  description: string;
  schemaUri: string;
  relatedDocs: string[];
}

interface MCPManifest {
  version: string;
  generatedAt: string;
  documentationHash: string;
  resourceCount: number;
  toolCount: number;
  resources: MCPResource[];
  tools: MCPTool[];
}

function calculateHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function extractFrontmatter(content: string): { title?: string; description?: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  
  const frontmatter = match[1];
  const title = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/)?.[1];
  const description = frontmatter.match(/description:\s*["']?([^"'\n]+)["']?/)?.[1];
  
  return { title, description };
}

function extractTitleFromMarkdown(content: string): string {
  // Try frontmatter first
  const { title } = extractFrontmatter(content);
  if (title) return title;
  
  // Try first H1
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1];
  
  return 'Untitled';
}

function categorizeDoc(filePath: string): string {
  if (filePath.includes('/contracts/')) return 'contracts';
  if (filePath.includes('/processes/')) return 'processes';
  if (filePath.includes('/governance/')) return 'governance';
  if (filePath.includes('/tokenomics/')) return 'tokenomics';
  if (filePath.includes('/architecture/')) return 'architecture';
  if (filePath.includes('/investor-deck/')) return 'investor';
  if (filePath.includes('/technical/')) return 'technical';
  if (filePath.includes('/mcp-integration/')) return 'mcp';
  return 'general';
}

function extractTags(filePath: string, content: string): string[] {
  const tags: string[] = [];
  
  // Category as tag
  tags.push(categorizeDoc(filePath));
  
  // Extract from content
  if (content.includes('RiskEngine')) tags.push('risk');
  if (content.includes('slashing')) tags.push('slashing');
  if (content.includes('governance')) tags.push('governance');
  if (content.includes('zkSync')) tags.push('zksync');
  if (content.includes('fund')) tags.push('fund');
  
  return [...new Set(tags)]; // Remove duplicates
}

async function generateMCPResources(): Promise<void> {
  console.log('🔄 Generating MCP resources from documentation...\n');
  
  const docsDir = path.join(process.cwd(), 'docs');
  const pattern = path.join(docsDir, '**/*.md');
  
  // Find all markdown files
  const files = glob.sync(pattern, { ignore: ['**/node_modules/**'] });
  
  console.log(`📚 Found ${files.length} documentation files\n`);
  
  const resources: MCPResource[] = [];
  let totalSize = 0;
  
  for (const file of files) {
    const relativePath = path.relative(docsDir, file);
    const content = fs.readFileSync(file, 'utf8');
    const stats = fs.statSync(file);
    
    // Generate URI
    const uri = `toss://docs/${relativePath.replace(/\.md$/, '').replace(/\\/g, '/')}`;
    
    // Extract metadata
    const title = extractTitleFromMarkdown(content);
    const { description } = extractFrontmatter(content);
    const category = categorizeDoc(file);
    const tags = extractTags(file, content);
    
    // Create resource
    const resource: MCPResource = {
      uri,
      name: title,
      description: description || `Documentation for ${title}`,
      mimeType: 'text/markdown',
      contentHash: calculateHash(content),
      lastModified: stats.mtime.toISOString(),
      size: stats.size,
      category,
      tags,
    };
    
    resources.push(resource);
    totalSize += stats.size;
  }
  
  // Calculate overall documentation hash
  const allContent = resources.map(r => r.contentHash).join('');
  const documentationHash = calculateHash(allContent);
  
  // Define MCP tools (conceptual - actual implementation would query contract ABIs)
  const tools: MCPTool[] = [
    {
      name: 'toss_create_fund',
      description: 'Create a new fund in TOSS Protocol',
      schemaUri: 'toss://schemas/tools/create-fund.json',
      relatedDocs: [
        'toss://docs/protocol/processes/fund-manager/create-fund',
        'toss://docs/protocol/contracts/fund/FundFactory',
      ],
    },
    {
      name: 'toss_execute_trade',
      description: 'Execute validated trade through RiskEngine',
      schemaUri: 'toss://schemas/tools/execute-trade.json',
      relatedDocs: [
        'toss://docs/protocol/processes/fund-manager/execute-trade',
        'toss://docs/protocol/contracts/fund/FundTradeExecutor',
        'toss://docs/protocol/contracts/risk/RiskEngine',
      ],
    },
    {
      name: 'toss_deposit_to_fund',
      description: 'Deposit capital into a fund',
      schemaUri: 'toss://schemas/tools/deposit.json',
      relatedDocs: [
        'toss://docs/protocol/processes/investor/deposit',
        'toss://docs/protocol/contracts/fund/FundManagerVault',
      ],
    },
    {
      name: 'toss_request_withdrawal',
      description: 'Request withdrawal from fund',
      schemaUri: 'toss://schemas/tools/withdraw.json',
      relatedDocs: [
        'toss://docs/protocol/processes/investor/withdraw',
      ],
    },
    {
      name: 'toss_create_proposal',
      description: 'Create governance proposal',
      schemaUri: 'toss://schemas/tools/create-proposal.json',
      relatedDocs: [
        'toss://docs/protocol/processes/governance/fund-proposal',
        'toss://docs/protocol/processes/governance/fm-proposal',
        'toss://docs/protocol/processes/governance/protocol-proposal',
      ],
    },
    {
      name: 'toss_vote_on_proposal',
      description: 'Cast vote on governance proposal',
      schemaUri: 'toss://schemas/tools/vote.json',
      relatedDocs: [
        'toss://docs/protocol/processes/governance/voting',
      ],
    },
    {
      name: 'toss_get_fund_info',
      description: 'Get comprehensive fund information',
      schemaUri: 'toss://schemas/tools/get-fund-info.json',
      relatedDocs: [
        'toss://docs/protocol/contracts/fund/FundRegistry',
      ],
    },
    {
      name: 'toss_validate_trade',
      description: 'Pre-validate trade before execution',
      schemaUri: 'toss://schemas/tools/validate-trade.json',
      relatedDocs: [
        'toss://docs/protocol/processes/risk-compliance/risk-validation',
        'toss://docs/protocol/contracts/risk/RiskEngine',
      ],
    },
    {
      name: 'toss_calculate_required_stake',
      description: 'Calculate TOSS stake required for fund',
      schemaUri: 'toss://schemas/tools/calculate-stake.json',
      relatedDocs: [
        'toss://docs/protocol/contracts/fund/FundFactory',
      ],
    },
    {
      name: 'toss_get_config_parameters',
      description: 'Get current DAO configuration parameters',
      schemaUri: 'toss://schemas/tools/get-config.json',
      relatedDocs: [
        'toss://docs/protocol/tokenomics/config-layer',
        'toss://docs/protocol/contracts/core/DAOConfigCore',
      ],
    },
  ];
  
  // Create manifest
  const manifest: MCPManifest = {
    version: '1.0.0', // Will be incremented on changes
    generatedAt: new Date().toISOString(),
    documentationHash,
    resourceCount: resources.length,
    toolCount: tools.length,
    resources,
    tools,
  };
  
  // Write manifest
  const manifestPath = path.join(process.cwd(), 'mcp-resources.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  // Write version tracking
  const versionPath = path.join(process.cwd(), 'mcp-version.json');
  fs.writeFileSync(versionPath, JSON.stringify({
    version: manifest.version,
    generatedAt: manifest.generatedAt,
    documentationHash: manifest.documentationHash,
    resourceCount: manifest.resourceCount,
    toolCount: manifest.toolCount,
    lastSync: new Date().toISOString(),
  }, null, 2));
  
  // Summary
  console.log('✅ MCP Resources Generated Successfully!\n');
  console.log(`📊 Summary:`);
  console.log(`   Resources: ${resources.length}`);
  console.log(`   Tools: ${tools.length}`);
  console.log(`   Total Size: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`   Doc Hash: ${documentationHash.substring(0, 16)}...`);
  console.log(`   Version: ${manifest.version}\n`);
  console.log(`💾 Saved to:`);
  console.log(`   ${manifestPath}`);
  console.log(`   ${versionPath}\n`);
}

// Run if called directly
if (require.main === module) {
  generateMCPResources().catch(err => {
    console.error('❌ Error generating MCP resources:', err);
    process.exit(1);
  });
}

export { generateMCPResources, calculateHash };

