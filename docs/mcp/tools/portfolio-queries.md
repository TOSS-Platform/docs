# Portfolio Query Tools

## Overview

MCP tools for querying portfolio data: holdings, allocations, performance, and analytics.

## Available Tools

### `toss_get_portfolio_holdings`

Get current portfolio holdings for a fund.

**Parameters**:
- `fundId`: Fund ID

**Returns**: Array of holdings with asset, balance, value, percentage

### `toss_get_portfolio_allocation`

Calculate asset allocation breakdown.

**Parameters**:
- `fundId`: Fund ID

**Returns**: Allocation percentages per asset, concentration metrics

### `toss_get_portfolio_performance`

Get performance metrics for a fund.

**Parameters**:
- `fundId`: Fund ID
- `period`: Time period (7d, 30d, 90d, 1y)

**Returns**: Returns, Sharpe ratio, max drawdown, volatility, etc.

### `toss_get_nav_history`

Get NAV history over time.

**Parameters**:
- `fundId`: Fund ID
- `fromTime`: Start timestamp
- `toTime`: End timestamp

**Returns**: Time series of NAV values

### `toss_calculate_position_impact`

Calculate impact of a potential position change.

**Parameters**:
- `fundId`: Fund ID
- `asset`: Asset address
- `amountChange`: Amount change (positive or negative)

**Returns**: New allocation, concentration impact, risk limit status

---

**Related**: [MCP Tools Overview](/mcp/tools/overview), [Portfolio Management](/protocol/processes/investor/deposit)

