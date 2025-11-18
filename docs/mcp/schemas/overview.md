---
sidebar_position: 1
---

# MCP Schemas Overview

JSON schemas defining TOSS MCP tools and resources.

## Available Schemas

### Tool Schemas

Tool schemas are available as JSON files in the MCP server. Access them via:

- Fund Operations: `fund-operations.json`
- Transaction Operations: `transaction-operations.json`
- Portfolio Operations: `portfolio-operations.json`
- Analytics Operations: `analytics-operations.json`

### Resource Schemas

Resources provide structured data access:

```
fund://{fundId}                    - Fund details
transaction://{transactionId}      - Transaction info
portfolio://{fundId}               - Portfolio holdings
analytics://{fundId}/summary       - Analytics data
```

## Schema Structure

Each tool schema includes:

```json
{
  "name": "tool_name",
  "description": "What the tool does",
  "inputSchema": {
    "type": "object",
    "required": ["param1"],
    "properties": {
      "param1": {
        "type": "string",
        "description": "Parameter description"
      }
    }
  }
}
```

## Using Schemas

Schemas are used automatically by MCP-compatible AI assistants. They describe:

- Available tools and their purpose
- Required and optional parameters
- Parameter types and constraints
- Expected return values

## Viewing Schemas

Download schemas:

```bash
curl http://localhost:3001/mcp/v1/schemas/fund-operations
```

Schemas are also available in the [MCP Integration](/mcp-integration/overview) section.

