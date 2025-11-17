---
sidebar_position: 4
---

# AI Integration Guide

Connect your AI assistant to TOSS using MCP.

## Supported AI Assistants

### Claude Desktop

1. Install Claude Desktop from [https://claude.ai/download](https://claude.ai/download)

2. Create MCP token in TOSS:

```bash
toss mcp:token:create --name "Claude Desktop"
```

3. Configure Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "toss": {
      "url": "http://localhost:3001",
      "token": "mcp_your_token_here"
    }
  }
}
```

4. Restart Claude Desktop

5. Test the connection:

```
Show me my TOSS funds
```

### Custom MCP Client

Build your own MCP client:

```javascript
import { MCPClient } from '@modelcontextprotocol/client';

const client = new MCPClient({
  url: 'http://localhost:3001',
  token: 'mcp_your_token_here'
});

await client.connect();
const tools = await client.listTools();
console.log('Available tools:', tools);
```

## Example Interactions

### Viewing Funds

```
User: Show me all my funds

AI: You have 3 funds:
1. Growth Portfolio ($75,000, +5.2%)
2. Conservative Fund ($50,000, +2.1%)
3. DeFi Holdings ($25,000, +12.5%)
```

### Creating Transactions

```
User: Buy 0.5 BTC in my Growth Portfolio

AI: I'll execute that trade...
✓ Purchased 0.5 BTC at $45,000
✓ Total cost: $22,500
✓ New portfolio value: $97,500
```

### Generating Reports

```
User: Generate a monthly report for all funds

AI: I've generated your monthly report. 
Overall performance: +6.2%
Best performer: DeFi Holdings (+12.5%)
Report saved to: reports/2024-01-monthly.pdf
```

## Troubleshooting

### Connection Issues

Check MCP server status:

```bash
toss mcp:status
```

### Permission Errors

Verify token permissions:

```bash
toss mcp:token:view mcp_your_token
```

## Next Steps

- [Example Prompts](/docs/mcp/examples/ai-prompts)
- [Available Tools](/docs/mcp/tools/overview)
- [Security Best Practices](/docs/mcp/advanced/security)

