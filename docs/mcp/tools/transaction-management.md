# Transaction Management Tools

## Overview

MCP tools for managing transactions: execution, validation, querying, and tracking.

## Available Tools

### `toss_execute_trade`

Execute a validated trade through RiskEngine.

**Parameters**:
- `fundId`: Fund ID
- `assetIn`: Input asset address
- `assetOut`: Output asset address
- `amountIn`: Amount to sell
- `minAmountOut`: Minimum acceptable output (slippage protection)
- `deadline`: Transaction deadline

**Returns**: `tradeId`, `amountOut`

**Example**:
```json
{
  "fundId": 42,
  "assetIn": "0x...USDC",
  "assetOut": "0x...WBTC",
  "amountIn": "10000000000",
  "minAmountOut": "2400000000",
  "deadline": 1234567890
}
```

### `toss_validate_trade`

Pre-validate trade before execution.

**Parameters**:
- `fundId`: Fund ID
- `tradeParams`: Trade parameters

**Returns**: `approved`, `faultIndex`, `warnings`

### `toss_get_transaction_history`

Get transaction history for a fund.

**Parameters**:
- `fundId`: Fund ID
- `fromTime`: Start timestamp
- `toTime`: End timestamp

**Returns**: Array of transactions

### `toss_get_transaction_status`

Get status of a specific transaction.

**Parameters**:
- `transactionId`: Transaction ID

**Returns**: Transaction status, details, confirmations

---

**Related**: [MCP Tools Overview](/mcp/tools/overview), [Trade Execution](/protocol/processes/fund-manager/execute-trade)

