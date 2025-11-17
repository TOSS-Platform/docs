# MCP Integration Guide

## For AI Developers

How to integrate TOSS MCP into your AI application.

## Setup

### 1. Install MCP Client

```bash
npm install @modelcontextprotocol/sdk
```

### 2. Connect to TOSS MCP Server

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: "my-ai-app",
  version: "1.0.0"
});

await client.connect({
  command: "npx",
  args: ["-y", "@toss/mcp-server"]
});
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
    const doc = await mcp.getResource("toss://docs/protocol/processes/fund-manager/create-fund");
    
    // 2. Check eligibility
    const eligible = await mcp.callTool("toss_check_fm_eligibility", { address: user.address });
    
    // 3. Provide guidance
    return buildResponse(doc, eligible);
  }
}
```

---

**Back**: [MCP Overview](/docs/mcp-integration/overview)

