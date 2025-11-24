# PenaltyEngine.sol

## Overview

Applies non-slashing penalties for minor violations, operational failures, and behavioral issues. Softer enforcement mechanism than slashing.

## Purpose

- Apply temporary trading restrictions
- Implement reputation penalties  
- Enforce compliance timeouts
- Issue warnings before slashing
- Track penalty history

## Functions

### `applyPenalty`

```solidity
function applyPenalty(
    address target,
    PenaltyType penaltyType,
    uint256 duration
) external onlyRiskEngine
```

**Purpose**: Apply penalty to FM or Investor

**Parameters**:
- `target`: FM or Investor address
- `penaltyType`: Type of penalty (TEMP_FREEZE, RATE_LIMIT, FEE_INCREASE)
- `duration`: How long penalty lasts

**Penalty Types**:
- `TEMP_FREEZE`: Cannot trade for duration
- `RATE_LIMIT`: Reduced trade frequency
- `FEE_INCREASE`: Higher fees for period
- `REPUTATION_REDUCTION`: Lower reputation score
- `WARNING`: Warning only, no operational restrictions

**Returns**: None (emits events)

**Events Emitted**:
- `PenaltyApplied`: General penalty application event
- `TempFreezePenalty`: When TEMP_FREEZE is applied
- `FeeIncreasePenalty`: When FEE_INCREASE is applied
- `RateLimitPenalty`: When RATE_LIMIT is applied
- `WarningPenalty`: When WARNING is applied

### `getPenaltyStatus`

```solidity
function getPenaltyStatus(
    address target
) external view returns (
    PenaltyRecord memory activePenalty,
    bool isCurrentlyFrozen,
    uint256 currentFeeMultiplier
)
```

**Purpose**: Get current penalty status for target

**Parameters**:
- `target`: FM or Investor address

**Returns**:
- `activePenalty`: Current active penalty record (most restrictive)
- `isCurrentlyFrozen`: Whether target is currently frozen
- `currentFeeMultiplier`: Current fee multiplier (basis points, 10000 = 1x)

### `getPenaltyHistory`

```solidity
function getPenaltyHistory(
    address target
) external view returns (PenaltyRecord[] memory)
```

**Purpose**: Get all penalties applied to target

**Parameters**:
- `target`: FM or Investor address

**Returns**: Array of penalty records with timestamps and types

### `isFrozen`

```solidity
function isFrozen(address target) external view returns (bool)
```

**Purpose**: Check if target is currently frozen

**Parameters**:
- `target`: FM or Investor address

**Returns**: `true` if frozen, `false` otherwise

### `getFeeMultiplier`

```solidity
function getFeeMultiplier(address target) external view returns (uint256)
```

**Purpose**: Get fee multiplier for target

**Parameters**:
- `target`: FM or Investor address

**Returns**: Fee multiplier in basis points (10000 = 1x, 11000 = 1.1x)

### `getRateLimitReduction`

```solidity
function getRateLimitReduction(address target) external view returns (uint256)
```

**Purpose**: Get rate limit reduction for target

**Parameters**:
- `target`: FM or Investor address

**Returns**: Rate limit reduction in basis points (10000 = 100%)

## State Variables

```solidity
IRiskEngine public immutable riskEngine;
IFundRegistry public immutable fundRegistry;

mapping(address => PenaltyRecord[]) public penaltyHistory;
mapping(address => mapping(PenaltyType => PenaltyRecord)) public activePenaltiesByType;

mapping(address => bool) private _isFrozen;
mapping(address => uint256) public freezeExpiration;
mapping(address => uint256) public rateLimitReduction; // Basis points (10000 = 100%)
mapping(address => uint256) public feeMultiplier; // Basis points (10000 = 1x)
mapping(address => uint256) public reputationPenalty; // Reputation penalty score
```

## Constructor

```solidity
constructor(address _riskEngine, address _fundRegistry)
```

**Purpose**: Initialize PenaltyEngine

**Parameters**:
- `_riskEngine`: RiskEngine contract address
- `_fundRegistry`: FundRegistry contract address

**Requirements**:
- Both addresses must be non-zero

## Events

```solidity
event PenaltyApplied(
    address indexed target,
    PenaltyType penaltyType,
    uint256 duration,
    uint256 expiration
);

event TempFreezePenalty(
    address indexed target,
    uint256 duration,
    uint256 expiration
);

event FeeIncreasePenalty(
    address indexed target,
    uint256 multiplier,
    uint256 expiration
);

event RateLimitPenalty(
    address indexed target,
    uint256 reduction,
    uint256 expiration
);

event WarningPenalty(address indexed target, string reason);

event PenaltyExpired(address indexed target, PenaltyType penaltyType);
```

## Custom Errors

```solidity
error NotRiskEngine();
error InvalidAddress();
error InvalidDuration();
error InvalidPenaltyType();
error MaxDurationExceeded();
```

## Types

### `PenaltyType` Enum

```solidity
enum PenaltyType {
    TEMP_FREEZE,        // Cannot trade for duration
    RATE_LIMIT,         // Reduced trade frequency
    FEE_INCREASE,       // Higher fees for period
    REPUTATION_REDUCTION, // Lower reputation score
    WARNING             // Warning only, no operational restrictions
}
```

### `PenaltyRecord` Struct

```solidity
struct PenaltyRecord {
    PenaltyType penaltyType;
    uint256 duration;
    uint256 expiration;
    uint256 timestamp;
}
```

**Fields**:
- `penaltyType`: Type of penalty applied
- `duration`: How long penalty lasts (in seconds)
- `expiration`: Timestamp when penalty expires
- `timestamp`: When penalty was applied

## Constants

- `MAX_PENALTY_DURATION`: 365 days (maximum penalty duration)
- `MAX_FEE_MULTIPLIER`: 20000 (2x maximum, 200%)
- `MAX_RATE_LIMIT_REDUCTION`: 9000 (90% maximum reduction)
- `BASIS_POINTS`: 10000

## Integration Points

**Incoming**:
- RiskEngine → `applyPenalty()` (when FI is between warning and slashing thresholds)

**Outgoing**:
- FundTradeExecutor → `isFrozen()` (check if FM is frozen before trade execution)
- FundTradeExecutor → `getRateLimitReduction()` (reduce daily trade limit based on penalty)

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Apply temporary freeze | PenaltyEngine applies temporary freeze penalty to FM | FM frozen for specified duration, freeze status recorded, FM cannot execute trades during freeze |
| Apply warning penalty | PenaltyEngine applies warning penalty to FM | Warning recorded, no operational restrictions, WarningPenalty event emitted |
| Apply fee increase penalty | PenaltyEngine applies fee increase penalty | FM's fee rates increased temporarily, FeeIncreasePenalty event emitted |
| Apply rate limit penalty | PenaltyEngine applies rate limit penalty to FM | FM's trade frequency reduced, RateLimitPenalty event emitted |
| Query penalty status | Query current penalty status for FM | Returns penalty type, duration, expiration time if applicable |
| Penalty expiration | Temporary penalty expires after duration | FM restrictions lifted, FM can operate normally again |
| Query penalty history | Query all penalties applied to FM | Returns array of penalty records with timestamps and types |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Apply penalty with zero duration | Attempt to apply temporary freeze with 0 duration | Transaction may succeed (no effect) or revert depending on implementation |
| Apply penalty with maximum duration | Apply temporary freeze with maximum allowed duration | Penalty applied successfully, duration capped at maximum |
| Apply multiple penalties | Multiple penalties applied to same FM | Penalties tracked independently, most restrictive penalty applies |
| Penalty expiration at boundary | Penalty expires exactly at expiration time | Restrictions lifted correctly, FM can operate immediately |
| Query penalty for FM with no penalties | Query penalty status for FM with no penalties | Returns default status or empty, no penalties found |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Apply penalty from non-authorized | Non-authorized address attempts to apply penalty | Transaction reverts with "Not authorized" error |
| Apply invalid penalty type | Attempt to apply invalid penalty type | Transaction reverts with validation error |
| Apply penalty to zero address | Attempt to apply penalty to zero address | Transaction reverts with InvalidAddress error |
| Apply penalty with invalid duration | Attempt to apply penalty with duration exceeding maximum | Transaction reverts with MaxDurationExceeded error |
| Query penalty for zero address | Query penalty status for zero address | Returns default status (empty penalty record) |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized penalty application | Attacker attempts to apply penalty to FM | Transaction reverts, only authorized contracts can apply penalties |
| Penalty duration enforcement | Verify penalty duration cannot be bypassed | Restrictions enforced until expiration, cannot bypass early |
| Penalty stacking prevention | Verify penalties don't stack inappropriately | Most restrictive penalty applies, penalties don't compound |
| Penalty history integrity | Verify penalty history cannot be manipulated | History append-only, past penalties cannot be modified |
| Freeze enforcement | Verify frozen FM cannot execute trades | Trade execution checks freeze status, frozen FMs rejected |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Apply penalty by authorized contract | Authorized contract (e.g., RiskEngine) applies penalty | Transaction succeeds |
| Apply penalty by non-authorized | Non-authorized attempts to apply penalty | Transaction reverts with "Not authorized" |
| Query functions by any address | Any address queries penalty status, history | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| RiskEngine penalty flow | RiskEngine detects violation, PenaltyEngine applies penalty | Complete flow succeeds, FM penalized appropriately |
| FundTradeExecutor freeze check | TradeExecutor checks FM freeze status before execution | Frozen FMs cannot execute trades, freeze enforced |
| Penalty expiration automation | Penalty expires automatically, restrictions lifted | Expiration checked correctly, FM can operate after expiration |
| Multiple penalty types | Different penalty types applied to FM | All penalties tracked correctly, most restrictive applies |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Penalty application gas | Authorized contract applies penalty | Gas usage reasonable for penalty application |
| Penalty status check gas | Check FM penalty status before operation | Gas usage reasonable for status check |
| Query operations gas | Multiple queries for penalty status, history | View functions consume no gas (read-only) |

---

**Next**: [IntentDetection](/protocol/contracts/risk/IntentDetection)

