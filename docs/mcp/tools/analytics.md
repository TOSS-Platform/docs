# Analytics Tools

## Overview

MCP tools for analytics and reporting: performance analysis, fee calculations, and reporting.

## Available Tools

### `toss_get_performance_metrics`

Calculate comprehensive performance metrics.

**Parameters**:
- `fundId`: Fund ID
- `period`: Time period
- `metrics`: Array of metrics to calculate

**Returns**: Requested performance metrics

**Metrics Available**:
- Total return
- Sharpe ratio
- Sortino ratio
- Maximum drawdown
- Volatility (annualized)
- Beta
- Alpha

### `toss_calculate_fees`

Calculate fees (management, performance, withdrawal).

**Parameters**:
- `fundId`: Fund ID
- `feeType`: Fee type (management, performance, withdrawal)

**Returns**: Fee amount, calculation details

### `toss_generate_report`

Generate performance or analytics report.

**Parameters**:
- `fundId`: Fund ID
- `reportType`: Report type (monthly, quarterly, annual, custom)
- `format`: Output format (json, pdf, csv)

**Returns**: Report data or file URL

### `toss_compare_performance`

Compare performance across multiple funds.

**Parameters**:
- `fundIds`: Array of fund IDs
- `period`: Time period
- `metrics`: Metrics to compare

**Returns**: Comparison data with rankings

---

**Related**: [MCP Tools Overview](/mcp/tools/overview), [Analytics Hub](/protocol/contracts/utilities/AnalyticsHub)

