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

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Query protocol state | Query current protocol state | Returns current state (ACTIVE, PAUSED, EMERGENCY) |
| Pause protocol (guardian) | Guardian pauses protocol in emergency | State transitions to PAUSED, lastPauseTime updated, pauseCount incremented, Paused event emitted |
| Unpause protocol | Governance unpauses protocol | State transitions to ACTIVE, Unpaused event emitted |
| Set protocol fee rate | Governance updates protocol fee rate within limits | Fee rate updated, ProtocolFeeRateUpdated event emitted |
| Query protocol version | Query current protocol version | Returns current version number |
| Query protocol fee rate | Query current protocol fee rate | Returns current fee rate in basis points |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Pause already paused | Guardian attempts to pause when already paused | Transaction may succeed (idempotent) or revert depending on implementation |
| Unpause when active | Governance attempts to unpause when already active | Transaction may succeed (idempotent) or revert |
| Set fee rate to zero | Governance sets protocol fee rate to 0 | Transaction succeeds, fee rate set to 0 |
| Set fee rate to maximum | Governance sets protocol fee rate to maximum allowed | Transaction succeeds, fee rate set to max (100 bps) |
| Query state at deployment | Query protocol state immediately after deployment | Returns ACTIVE state |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Pause from non-guardian | Non-guardian address attempts to pause protocol | Transaction reverts with "Not guardian or governance" error |
| Unpause from non-governance | Non-governance address attempts to unpause | Transaction reverts with "Not governance" error |
| Set fee rate from non-governance | Non-governance address attempts to update fee rate | Transaction reverts with "Not governance" error |
| Set fee rate exceeds maximum | Governance attempts to set fee rate above 100 bps | Transaction reverts with "Fee rate exceeds maximum" error |
| Set fee rate change too large | Governance attempts to change fee rate by more than 50% | Transaction reverts with "Fee change too large" error |
| Pause when in emergency state | Attempt to pause when already in EMERGENCY state | Transaction may succeed or revert (depends on state machine logic) |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized pause | Attacker attempts to pause protocol | Transaction reverts, only guardian or governance can pause |
| Prevent unauthorized unpause | Attacker attempts to unpause protocol | Transaction reverts, only governance can unpause |
| Prevent fee rate manipulation | Verify fee rate cannot be set to extreme values | Bounds enforced, fee rate remains within safe limits |
| Pause count tracking | Multiple pauses tracked correctly | Pause count increments correctly, cannot be manipulated |
| State transition validation | Verify only valid state transitions allowed | Invalid transitions revert (e.g., EMERGENCY cannot directly go to ACTIVE) |
| Guardian cannot unpause | Verify guardian can pause but cannot unpause | Guardian pause succeeds, guardian unpause reverts |
| Fee rate change limits | Verify fee rate cannot change more than 50% per proposal | Change limit enforced, prevents sudden extreme changes |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Pause by guardian | Guardian pauses protocol | Transaction succeeds |
| Pause by governance | Governance pauses protocol | Transaction succeeds |
| Pause by non-authorized | Non-authorized address attempts to pause | Transaction reverts with "Not guardian or governance" |
| Unpause by governance | Governance unpauses protocol | Transaction succeeds |
| Unpause by non-governance | Non-governance attempts to unpause | Transaction reverts with "Not governance" |
| Set fee rate by governance | Governance updates fee rate | Transaction succeeds |
| Set fee rate by non-governance | Non-governance attempts to update fee rate | Transaction reverts with "Not governance" |
| Query functions by any address | Any address queries state, version, fee rate | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Protocol pause affects operations | Protocol paused, other contracts check state before operations | Other contracts respect paused state, operations blocked |
| Fee rate used by contracts | Protocol fee rate queried by other contracts for fee calculations | Fee calculations use current fee rate from ChainState |
| State monitoring | Off-chain systems monitor protocol state changes via events | Events captured correctly, monitoring systems updated |
| Emergency procedures | Protocol enters emergency state, emergency procedures activated | Emergency state properly communicated, procedures execute correctly |
| Version tracking | Protocol version updated on upgrades | Version increments correctly, tracking maintained |

### State Transition Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| ACTIVE → PAUSED | Guardian or governance pauses active protocol | State transitions correctly to PAUSED |
| PAUSED → ACTIVE | Governance unpauses paused protocol | State transitions correctly to ACTIVE |
| ACTIVE → EMERGENCY | Protocol enters emergency state | State transitions correctly to EMERGENCY |
| EMERGENCY → PAUSED | Emergency state transitions to paused | Transition may be allowed or blocked (depends on implementation) |
| EMERGENCY → ACTIVE | Attempt to go directly from emergency to active | Transaction reverts, must go through paused state first |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Pause operation gas | Guardian pauses protocol | Gas usage reasonable for state change |
| Unpause operation gas | Governance unpauses protocol | Gas usage reasonable for state change |
| Fee rate update gas | Governance updates fee rate | Gas usage reasonable for parameter update |
| Query operations gas | Multiple queries for state, version, fee rate | View functions consume no gas (read-only) |

---

**Core Contracts Complete** | [Fund Layer →](/docs/protocol/contracts/fund/FundFactory)
