# MCP Integration Guide

## For AI Developers

How to integrate TOSS MCP into your AI application.

## Setup

:::tip Using Cursor IDE?
See the dedicated setup guide: [Cursor Setup Guide](/docs/mcp-integration/cursor-setup)
:::

### 1. Install MCP Client

```bash
npm install @modelcontextprotocol/sdk
```

### 2. Configure MCP Endpoints

**Production Environment**:
```typescript
const MCP_CONFIG = {
  manifestUrl: 'https://docs.toss.fi/mcp-version.json',
  resourcesUrl: 'https://docs.toss.fi/mcp-resources.json',
  baseUrl: 'https://docs.toss.fi/docs/'
};
```

**Staging Environment**:
```typescript
const MCP_CONFIG = {
  manifestUrl: 'https://staging.docs.toss.fi/mcp-version.json',
  resourcesUrl: 'https://staging.docs.toss.fi/mcp-resources.json',
  baseUrl: 'https://staging.docs.toss.fi/docs/'
};
```

### 3. Connect to TOSS MCP Server

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: "my-ai-app",
  version: "1.0.0"
});

// Option 1: Connect to MCP server (if available)
await client.connect({
  command: "npx",
  args: ["-y", "@toss/mcp-server"]
});

// Option 2: Direct HTTP access to MCP resources
const manifest = await fetch(MCP_CONFIG.manifestUrl).then(r => r.json());
const resources = await fetch(MCP_CONFIG.resourcesUrl).then(r => r.json());

// Resource URI resolution:
// toss://docs/{path} → {baseUrl}{path}.md
const resolveResourceUri = (uri: string) => {
  if (uri.startsWith('toss://docs/')) {
    const path = uri.replace('toss://docs/', '');
    return `${MCP_CONFIG.baseUrl}${path}.md`;
  }
  return uri;
};
```

### 3. List Available Tools

```typescript
const tools = await client.listTools();
console.log(`Available: ${tools.tools.length} tools`);
```

### 4. Call a Tool

```typescript
const result = await client.callTool({
  name: "toss_get_fund_info",
  arguments: { fundId: 42 }
});

console.log(result.content);
```

## AI Prompt Engineering

### System Prompt

```
You are helping users interact with TOSS Protocol.

Before any operation:
1. Retrieve relevant documentation
2. Validate parameters
3. Calculate costs
4. Warn of risks
5. Provide code example

Use MCP tools to:
- Get fund information
- Validate operations
- Calculate requirements
- Check eligibility
```

### Example Flow

```typescript
async function handleUserQuery(query: string) {
  if (query.includes("create fund")) {
    // 1. Get documentation
    // URI: toss://docs/protocol/processes/fund-manager/create-fund
    // Resolves to: https://docs.toss.fi/docs/protocol/processes/fund-manager/create-fund.md
    const docUri = resolveResourceUri("toss://docs/protocol/processes/fund-manager/create-fund");
    const doc = await fetch(docUri).then(r => r.text());
    
    // 2. Check eligibility
    const eligible = await mcp.callTool("toss_check_fm_eligibility", { address: user.address });
    
    // 3. Provide guidance
    return buildResponse(doc, eligible);
  }
}
```

## MCP Endpoint URLs

### Production (`docs.toss.fi`)
- **Manifest**: `https://docs.toss.fi/mcp-version.json`
- **Resources**: `https://docs.toss.fi/mcp-resources.json`
- **Documentation Base**: `https://docs.toss.fi/docs/`
- **Resource Resolution**: `toss://docs/{path}` → `https://docs.toss.fi/docs/{path}.md`

### Staging (`staging.docs.toss.fi`)
- **Manifest**: `https://staging.docs.toss.fi/mcp-version.json`
- **Resources**: `https://staging.docs.toss.fi/mcp-resources.json`
- **Documentation Base**: `https://staging.docs.toss.fi/docs/`
- **Resource Resolution**: `toss://docs/{path}` → `https://staging.docs.toss.fi/docs/{path}.md`

### URI Format
- **Documentation**: `toss://docs/{category}/{subcategory}/{page}`
  - Example: `toss://docs/protocol/contracts/risk/RiskEngine`
  - Resolves to: `{baseUrl}protocol/contracts/risk/RiskEngine.md`
  
- **State**: `toss://state/{resource}/{id}`
  - Example: `toss://state/funds/42`
  - Resolves via MCP server API calls
  
- **Templates**: `toss://templates/{template-name}`
  - Example: `toss://templates/fund-config`
  - Resolves via MCP server API calls

---

**Back**: [MCP Overview](/docs/mcp-integration/overview)

