---
sidebar_position: 2
---

# Introduction to MCP

Understanding the Model Context Protocol and its role in TOSS.

## What is the Model Context Protocol?

The **Model Context Protocol (MCP)** is an open standard created by Anthropic that enables AI models to securely connect to external tools and data sources. Think of it as a universal translator between AI assistants and applications.

### Key Concepts

#### Tools

Tools are actions that AI assistants can perform. In TOSS, tools include:
- Creating funds
- Executing transactions
- Querying portfolios
- Generating reports

#### Resources

Resources are data sources that AI assistants can read. In TOSS, resources include:
- Fund details
- Transaction history
- Performance metrics
- Analytics data

#### Prompts

Prompts are pre-defined templates that help structure requests to AI assistants.

## How MCP Works

### 1. Discovery

The AI assistant connects to TOSS MCP server and discovers available tools:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

TOSS responds with available tools and their schemas.

### 2. Tool Execution

When you ask the AI to perform an action, it calls the appropriate tool:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "create_fund",
    "arguments": {
      "name": "My Fund",
      "currency": "USD"
    }
  },
  "id": 2
}
```

### 3. Response

TOSS executes the operation and returns results:

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [{
      "type": "text",
      "text": "Fund created successfully with ID: abc123"
    }]
  },
  "id": 2
}
```

## Why Use MCP with TOSS?

### Traditional Approach

```bash
# You need to remember commands
toss fund:create --name "My Fund" --currency USD --strategy balanced

# Then check status
toss fund:view --id abc123

# Then add holdings
toss transaction:create --fund-id abc123 --type buy --asset BTC --amount 1
```

### MCP Approach

```
You: Create a balanced fund called "My Fund" in USD, 
     then buy 1 BTC for it

AI: I'll do that for you...
    ✓ Created fund "My Fund" (ID: abc123)
    ✓ Purchased 1 BTC at $45,000
    Your fund is ready with $45,000 in BTC!
```

## Use Cases

### Personal Portfolio Management

```
"Show me how all my funds performed last month"
"Alert me if any fund drops more than 10%"
"Suggest rebalancing opportunities"
```

### Professional Fund Management

```
"Generate quarterly reports for all client funds"
"Compare our Bitcoin fund against market benchmarks"
"Create a risk assessment for the growth portfolio"
```

### Automated Operations

```
"If Bitcoin hits $50k, take 20% profits in the growth fund"
"Rebalance all funds weekly to maintain target allocations"
"Send me daily summaries of all fund performance"
```

### Research & Analysis

```
"What's the correlation between my funds?"
"Analyze the risk-adjusted returns of my strategies"
"Show me which assets contributed most to returns"
```

## MCP vs Traditional APIs

| Feature | Traditional API | MCP |
|---------|----------------|-----|
| **Interface** | HTTP endpoints | Natural language |
| **Learning Curve** | Read API docs | Just ask questions |
| **Flexibility** | Fixed endpoints | AI interprets intent |
| **Composability** | Manual chaining | AI chains operations |
| **Error Handling** | Manual parsing | AI explains errors |

## Example: Complex Workflow

### Without MCP

```bash
# Step 1: Get fund ID
FUND_ID=$(toss fund:list --name "Growth" --format json | jq -r '.[0].id')

# Step 2: Get current allocation
toss portfolio:view --fund-id $FUND_ID --format json > current.json

# Step 3: Calculate new allocation
python calculate_rebalance.py current.json > target.json

# Step 4: Execute rebalance
toss portfolio:rebalance --fund-id $FUND_ID --config target.json

# Step 5: Generate report
toss report:generate --fund-id $FUND_ID --type rebalance > report.pdf
```

### With MCP

```
"Rebalance my Growth fund to optimal allocation and 
send me a report of the changes"
```

The AI handles all the steps automatically!

## Security & Privacy

### What AI Can Access

- Only data from funds you explicitly authorize
- Limited by token permissions
- Logged and auditable

### What AI Cannot Access

- Funds from other users
- System configuration
- Private keys or credentials

### Controlling Access

```bash
# Create read-only token for analysis
toss mcp:token:create --name "AI Analyst" --permissions read

# Create limited token for specific fund
toss mcp:token:create --name "Growth Fund Manager" \
  --permissions read,write \
  --funds growth-fund-id

# Revoke token if needed
toss mcp:token:revoke mcp_abc123...
```

## Getting Started

### Prerequisites

- TOSS installed and running
- MCP-compatible AI assistant (e.g., Claude Desktop)
- Basic understanding of your funds

### Quick Setup

1. **Enable MCP in TOSS:**

```bash
toss mcp:enable
```

2. **Create Access Token:**

```bash
toss mcp:token:create --name "My AI Assistant"
```

3. **Configure AI Assistant:**

Add TOSS MCP server to your AI assistant configuration.

4. **Start Using:**

```
"Hey AI, show me my TOSS funds"
```

### Detailed Guides

- [Setup Guide](/docs/mcp/setup) - Complete setup instructions
- [AI Integration](/docs/mcp/ai-integration) - Connect specific AI assistants
- [Security Best Practices](/docs/mcp/advanced/security) - Secure your integration

## Common Questions

### Do I need to use MCP?

No! MCP is optional. You can still use TOSS via:
- Web interface
- CLI commands  
- REST API
- GraphQL API

MCP just provides a more natural interface.

### Which AI assistants support MCP?

Currently:
- Claude Desktop (official support)
- Custom MCP clients
- Coming soon: GPT, Gemini, and others

### Is my data secure?

Yes! MCP uses:
- Encrypted connections (HTTPS/WSS)
- Token-based authentication
- Granular permissions
- Complete audit logging

### Can AI make changes without asking?

Only if you grant write permissions. You can:
- Use read-only tokens for analysis
- Require confirmation for transactions
- Set spending limits per token

## Next Steps

Ready to enable MCP?

1. [Setup MCP Server](/docs/mcp/setup)
2. [Connect Your AI Assistant](/docs/mcp/ai-integration)
3. [Explore Example Prompts](/docs/mcp/examples/ai-prompts)
4. [Learn About Available Tools](/docs/mcp/tools/overview)

## Resources

- [MCP Official Specification](https://modelcontextprotocol.org)
- [TOSS MCP Schema Reference](/docs/mcp/schemas/overview)
- [MCP Security Guide](/docs/mcp/advanced/security)
- [Community Examples](https://github.com/toss/mcp-examples)

