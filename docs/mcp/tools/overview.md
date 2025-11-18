---
sidebar_position: 1
---

# MCP Tools Overview

Complete reference of available MCP tools in TOSS.

## Tool Categories

### Fund Management Tools

- `create_fund` - Create new crypto funds
- `get_fund` - Retrieve fund details
- `list_funds` - List all accessible funds
- `update_fund` - Modify fund settings
- `close_fund` - Close and liquidate funds

[View Fund Tools Details →](/mcp/tools/fund-operations)

### Transaction Tools

- `create_transaction` - Execute trades
- `get_transaction` - View transaction details
- `list_transactions` - Query transaction history
- `cancel_transaction` - Cancel pending transactions

[View Transaction Tools Details →](/mcp/tools/transaction-management)

### Portfolio Tools

- `get_portfolio` - View current holdings
- `get_portfolio_performance` - Analyze performance
- `get_asset_allocation` - Check allocation
- `rebalance_portfolio` - Rebalance to targets

[View Portfolio Tools Details →](/mcp/tools/portfolio-queries)

### Analytics Tools

- `get_analytics_summary` - Comprehensive analytics
- `calculate_risk_metrics` - Risk analysis
- `compare_funds` - Compare multiple funds
- `generate_report` - Create detailed reports

[View Analytics Tools Details →](/mcp/tools/analytics)

## Using Tools

Tools are called automatically by AI assistants based on your requests. You don't need to call them directly.

### Example

```
User: Create a balanced fund called "My Portfolio" with $10,000

AI internally calls:
{
  "tool": "create_fund",
  "arguments": {
    "name": "My Portfolio",
    "currency": "USD",
    "strategy": "balanced",
    "initialDeposit": 10000
  }
}
```

## Tool Schemas

Each tool has a JSON schema defining its inputs and outputs. View the complete schemas:

- [Fund Operations Schema](/mcp/schemas/fund-schema)
- [Transaction Schema](/mcp/schemas/transaction-schema)
- [Portfolio Schema](/mcp/schemas/portfolio-schema)

## Next Steps

- [Fund Operations](/mcp/tools/fund-operations)
- [Example Prompts](/mcp/examples/ai-prompts)
- [JSON Schemas](/mcp/schemas/overview)

