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

**Next**: [AMLGuard](/docs/protocol/contracts/utilities/AMLGuard)

