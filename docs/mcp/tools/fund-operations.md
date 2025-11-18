# Fund Operations Tools

## Overview

MCP tools for managing funds: creation, configuration, querying, and analysis.

## Available Tools

### `toss_create_fund`

Create a new fund in TOSS Protocol.

**Parameters**:
- `fundName`: Fund name
- `fundClass`: Fund class (ALPHA, BALANCED, STABLE, QUANT, INDEX)
- `riskTier`: Risk tier (1-4)
- `projectedAUM`: Projected assets under management
- `config`: Fund configuration object

**Returns**: `fundId`, `fundAddress`

**Example**:
```json
{
  "fundName": "Alpha Crypto Fund",
  "fundClass": "ALPHA",
  "riskTier": 3,
  "projectedAUM": 2000000,
  "config": {
    "managementFee": 2,
    "performanceFee": 20,
    "maxLeverage": 5
  }
}
```

### `toss_get_fund_info`

Get comprehensive information about a fund.

**Parameters**:
- `fundId`: Fund ID

**Returns**: Fund details, NAV, holdings, risk parameters, status

### `toss_update_fund_config`

Update fund configuration (requires governance approval).

**Parameters**:
- `fundId`: Fund ID
- `updates`: Configuration updates

**Returns**: `proposalId`

### `toss_list_funds`

List all funds matching criteria.

**Parameters**:
- `filter`: Optional filter (by FM, class, status, etc.)

**Returns**: Array of fund summaries

---

**Related**: [MCP Tools Overview](/mcp/tools/overview), [Fund Management](/protocol/processes/fund-manager/create-fund)

