# TOSSChainState.sol

## Overview

Tracks global protocol state and parameters, serving as the single source of truth for protocol-wide configuration.

## Purpose

- Store protocol-wide parameters
- Track protocol state (active, paused, emergency)
- Provide global configuration queries
- Enable protocol-wide state transitions

## Core Responsibilities

- ✅ Maintain global protocol state
- ✅ Store protocol parameters
- ✅ Track protocol version
- ✅ Handle pause/unpause
- ✅ Emit state change events

## State Variables

```solidity
// ===== Protocol State =====
enum ProtocolState { ACTIVE, PAUSED, EMERGENCY }
ProtocolState public state;

// ===== Version Tracking =====
uint256 public protocolVersion;  // e.g., 100 = v1.0.0

// ===== Global Parameters =====
uint256 public protocolFeeRate;     // Basis points (e.g., 10 = 0.1%)
uint256 public minFMStake;          // Minimum FM stake in TOSS
uint256 public slashingBurnRatio;   // % of slash that's burned (vs NAV compensation)

// ===== Emergency Controls =====
address public emergencyAdmin;
uint256 public lastPauseTime;
uint256 public pauseCount;
```

## Functions

### `getProtocolState`

```solidity
function getProtocolState() external view returns (ProtocolState)
```

**Returns**: Current protocol state

### `pause`

```solidity
function pause() external onlyGuardianOrGovernance
```

**Purpose**: Pause protocol in emergency

**Access Control**: Guardian or Governance

### `unpause`

```solidity
function unpause() external onlyGovernance
```

**Purpose**: Resume protocol operations

**Access Control**: Only governance (not guardian)

### `setProtocolFeeRate`

```solidity
function setProtocolFeeRate(uint256 newRate) external onlyGovernance
```

**Purpose**: Update protocol fee rate

**Parameters**:
- `newRate`: New fee in basis points

**Access Control**: Only governance

**Validations**:
- Must be ≤100 (1% max)
- Can't change more than 50% per proposal

## DAO-Configurable Parameters

| Parameter | Range | Governance Level |
|-----------|-------|------------------|
| `protocolFeeRate` | 0-100 bps | Protocol |
| `minFMStake` | 5k-100k TOSS | FM-level |
| `slashingBurnRatio` | 10-30% | Protocol |

## Test Scenarios

```typescript
it("should pause protocol", async () => {
  await chainState.connect(guardian).pause();
  expect(await chainState.state()).to.equal(ProtocolState.PAUSED);
});
```

---

**Core Contracts Complete** | [Fund Layer →](/docs/protocol/contracts/fund/FundFactory)
