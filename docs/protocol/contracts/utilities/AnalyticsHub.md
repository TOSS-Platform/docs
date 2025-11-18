# AnalyticsHub.sol

## Overview

Stores historical protocol data on-chain for indexing, including NAV history, trade logs, slashing events, and performance metrics.

## Purpose

- Store historical NAV snapshots
- Log all trades for analysis
- Record slashing events
- Track fund performance
- Enable subgraph indexing

## State Variables

```solidity
struct NAVSnapshot {
    uint256 fundId;
    uint256 nav;
    uint256 timestamp;
    uint256 blockNumber;
}

mapping(uint256 => NAVSnapshot[]) public navHistory;  // fundId => snapshots

struct TradeLog {
    uint256 fundId;
    address assetIn;
    address assetOut;
    uint256 amountIn;
    uint256 amountOut;
    uint256 timestamp;
}

TradeLog[] public trades;
```

## Functions

### `recordNAV`

```solidity
function recordNAV(
    uint256 fundId,
    uint256 nav
) external onlyNAVEngine
```

**Purpose**: Store NAV snapshot

**Parameters**:
- `fundId`: Fund identifier
- `nav`: Net Asset Value

**Access Control**: Only NAV Engine

### `recordTrade`

```solidity
function recordTrade(
    uint256 fundId,
    address assetIn,
    address assetOut,
    uint256 amountIn,
    uint256 amountOut
) external onlyTradeExecutor
```

**Purpose**: Log trade for analytics

### Query Functions

#### `getNAVHistory`

```solidity
function getNAVHistory(
    uint256 fundId,
    uint256 fromTime,
    uint256 toTime
) external view returns (NAVSnapshot[] memory)
```

**Purpose**: Get NAV history for time range

---

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Record NAV snapshot | NAV Engine records NAV snapshot for fund | NAV snapshot stored, NAVHistoryUpdated event emitted, snapshot retrievable |
| Record trade log | FundTradeExecutor records trade execution | Trade log stored, TradeRecorded event emitted, trade data retrievable |
| Query NAV history | Query NAV history for fund within time range | NAV snapshots returned for specified time range, data accurate |
| Query trade history | Query trade history for fund | All trades returned, trade data accurate |
| Query fund performance | Query performance metrics for fund | Performance metrics calculated correctly, data accurate |
| Record slashing event | SlashingEngine records slashing event | Slashing event stored, SlashingEventRecorded event emitted, event retrievable |
| Query slashing history | Query slashing events for fund | All slashing events returned, event data accurate |
| Record multiple NAV snapshots | NAV Engine records multiple NAV snapshots over time | All snapshots stored correctly, history maintained chronologically |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Record NAV with zero value | Attempt to record NAV of zero | NAV snapshot recorded (zero is valid), snapshot stored correctly |
| Record NAV with maximum value | Attempt to record NAV with max uint256 | NAV snapshot recorded, large values handled correctly |
| Query NAV history with empty range | Query NAV history for time range with no snapshots | Empty array returned, no error |
| Query NAV history with single snapshot | Query NAV history for time range with one snapshot | Single snapshot returned correctly |
| Record trade with zero amount | Attempt to record trade with zero amount | Trade log recorded (zero is valid), log stored correctly |
| Record duplicate NAV | Attempt to record same NAV value twice | Both snapshots recorded, duplicates allowed (timestamp differs) |
| Query history at boundary | Query history exactly at snapshot timestamps | Boundary snapshots included or excluded based on implementation |
| Record many snapshots | Record large number of NAV snapshots (e.g., 10,000) | All snapshots stored correctly, queries remain efficient |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Record NAV from non-authorized | Non-authorized address attempts to record NAV | Transaction reverts with "Only NAV Engine" error |
| Record trade from non-authorized | Non-authorized address attempts to record trade | Transaction reverts with "Only Trade Executor" error |
| Query NAV for non-existent fund | Query NAV history for fund ID that doesn't exist | Empty array returned or reverts depending on implementation |
| Query with invalid time range | Query NAV history with fromTime &gt; toTime | Transaction reverts with "Invalid time range" error |
| Record NAV with invalid fund ID | Attempt to record NAV with invalid fund ID | Transaction reverts with validation error |
| Record trade with invalid parameters | Attempt to record trade with invalid asset addresses | Transaction reverts with validation error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized NAV recording | Attacker attempts to record NAV snapshot | Transaction reverts, only NAV Engine can record NAV |
| Prevent unauthorized trade recording | Attacker attempts to record trade log | Transaction reverts, only Trade Executor can record trades |
| Data integrity verification | Verify recorded NAV and trade data cannot be manipulated | Data immutable once recorded, past records cannot be modified |
| History tampering prevention | Verify historical records cannot be deleted or modified | History append-only, past records immutable |
| Access control enforcement | Verify access control enforced for all write operations | All write operations check authorization, unauthorized access rejected |
| Event emission integrity | Verify all events emitted correctly for audit trail | All events emitted, event data matches recorded data |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Record NAV by NAV Engine | NAV Engine records NAV snapshot | Transaction succeeds |
| Record NAV by non-authorized | Non-authorized attempts to record NAV | Transaction reverts with "Only NAV Engine" |
| Record trade by Trade Executor | FundTradeExecutor records trade log | Transaction succeeds |
| Record trade by non-authorized | Non-authorized attempts to record trade | Transaction reverts with "Only Trade Executor" |
| Query functions by any address | Any address queries NAV history, trade history, performance | Queries succeed, read-only functions are public |
| Record slashing by SlashingEngine | SlashingEngine records slashing event | Transaction succeeds |
| Record slashing by non-authorized | Non-authorized attempts to record slashing event | Transaction reverts with "Not authorized" |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| NAV Engine integration | NAV Engine calculates NAV, AnalyticsHub records snapshot | NAV recorded correctly, history maintained |
| Trade Executor integration | FundTradeExecutor executes trade, AnalyticsHub records log | Trade recorded correctly, all trade data stored |
| SlashingEngine integration | SlashingEngine slashes fund, AnalyticsHub records event | Slashing event recorded correctly, event data stored |
| Subgraph indexing integration | Off-chain subgraph indexes events from AnalyticsHub | All events indexed correctly, subgraph data matches on-chain data |
| Performance calculation integration | AnalyticsHub calculates fund performance from NAV history | Performance metrics calculated correctly, data accurate |
| Multiple fund tracking | AnalyticsHub tracks NAV and trades for multiple funds | All funds tracked independently, data isolated correctly |
| Historical query integration | External contracts query historical NAV and trade data | Historical queries return correct data, queries efficient |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| NAV recording gas | NAV Engine records NAV snapshot | Gas usage reasonable for recording operation |
| Trade recording gas | FundTradeExecutor records trade log | Gas usage reasonable for recording operation |
| NAV history query gas | Query NAV history for fund | Gas usage reasonable for query operation |
| Trade history query gas | Query trade history for fund | Gas usage reasonable for query operation |
| Query operations gas | Multiple queries for NAV history, trade history | View functions consume no gas (read-only) |
| Batch recording gas | Record multiple NAV snapshots in batch | Batch recording efficient, gas usage reasonable |

---

**Next**: [AMLGuard](/protocol/contracts/utilities/AMLGuard)

