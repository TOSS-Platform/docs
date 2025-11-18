# Basic Query Examples

## Overview

Common query patterns and examples for interacting with TOSS Protocol through MCP.

## Fund Queries

### Get Fund Details

```
Query: Get fund information for fund ID 42
Response: Fund name, NAV, holdings, risk parameters, status
```

### List All Funds

```
Query: List all funds I manage
Response: Array of fund IDs, names, AUM, status
```

### Fund Performance

```
Query: Get performance metrics for fund 42 over last 30 days
Response: Returns, Sharpe ratio, max drawdown, volatility
```

## Transaction Queries

### Transaction History

```
Query: Get all transactions for fund 42 today
Response: Array of transactions with amounts, assets, timestamps
```

### Pending Transactions

```
Query: Show pending withdrawal requests for fund 42
Response: Array of pending withdrawals with amounts and timestamps
```

## Portfolio Queries

### Current Holdings

```
Query: Get current portfolio holdings for fund 42
Response: Asset balances, values, percentages of NAV
```

### Asset Allocation

```
Query: Calculate asset allocation breakdown for fund 42
Response: Percentage allocation per asset, concentration metrics
```

## Risk Queries

### Risk Limits Check

```
Query: Check if current positions in fund 42 violate any risk limits
Response: Risk check results, violations (if any), recommendations
```

### Position Size Analysis

```
Query: What's the maximum position size allowed for BTC in fund 42?
Response: Position Size Limit (PSL), current position, remaining capacity
```

## Analytics Queries

### NAV History

```
Query: Get NAV history for fund 42 over last 7 days
Response: Time series of NAV values, timestamps, changes
```

### Fee Calculation

```
Query: Calculate management fee due for fund 42
Response: Fee amount, calculation method, due date
```

## Governance Queries

### Active Proposals

```
Query: List all active proposals for fund 42
Response: Proposal details, voting status, deadlines
```

### Voting Eligibility

```
Query: Am I eligible to vote on proposal 123?
Response: Eligibility status, voting power, requirements
```

---

**Related**: [AI Prompts](/mcp/examples/ai-prompts), [MCP Tools](/mcp/tools/overview), [Protocol Overview](/mcp/protocol-overview)

