---
sidebar_position: 1
---

# MCP Schemas Overview

JSON schemas defining TOSS MCP tools and resources.

## Available Schemas

### Tool Schemas

- [Fund Operations](/mcp/schemas/fund-operations.json) - Fund management tools
- [Transaction Operations](/mcp/schemas/transaction-operations.json) - Transaction tools
- [Portfolio Operations](/mcp/schemas/portfolio-operations.json) - Portfolio tools
- [Analytics Operations](/mcp/schemas/analytics-operations.json) - Analytics tools

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

Or view them in the documentation:

- [Fund Schema](/mcp/schemas/fund-operations.json)
- [Transaction Schema](/mcp/schemas/transaction-operations.json)
- [Portfolio Schema](/mcp/schemas/portfolio-operations.json)
- [Analytics Schema](/mcp/schemas/analytics-operations.json)

