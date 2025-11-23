# InvestorPenaltyEngine.sol

## Overview

Applies penalties to investors for violations, including withdrawal delays, fee increases, and temporary restrictions. Uses severity-based penalty system with gradual escalation mechanism.

## Purpose

- Apply investor penalties
- Track penalty history
- Enforce compliance
- Gradual escalation based on violation count
- Automatic penalty expiration

## Dependencies

- **InvestorRegistry**: Provides investor registration status
- **InvestorRiskDomain**: Authorized to apply penalties based on risk analysis

## Types

### `PenaltyType` Enum

```solidity
enum PenaltyType {
    WITHDRAWAL_DELAY,  // Withdrawal delay extension
    FEE_INCREASE,      // Fee multiplier increase
    LIMIT_REDUCTION,   // Reduced investment limits
    TEMP_FREEZE        // Temporary freeze
}
```

### `PenaltyRecord` Struct

```solidity
struct PenaltyRecord {
    PenaltyType penaltyType;
    uint256 severity;      // Severity level (1-10, may be escalated)
    uint256 duration;     // Duration in seconds
    uint256 expiration;   // Expiration timestamp
    uint256 timestamp;    // When penalty was applied
}
```

## Constants

- `MAX_SEVERITY = 10`: Maximum severity level
- `MIN_SEVERITY = 1`: Minimum severity level
- `MAX_PENALTY_DURATION = 365 days`: Maximum penalty duration
- `MAX_FEE_MULTIPLIER = 20000`: Maximum fee multiplier (2x = 200%)
- `MAX_WITHDRAWAL_DELAY = 30 days`: Maximum additional withdrawal delay
- `MAX_LIMIT_REDUCTION = 9000`: Maximum investment limit reduction (90%)
- `ESCALATION_MULTIPLIER = 12000`: Escalation multiplier per violation (1.2x in basis points)
- `BASE_DURATION_PER_SEVERITY = 1 days`: Base duration per severity level

## State Variables

```solidity
IInvestorRegistry public immutable investorRegistry;
IInvestorRiskDomain public immutable investorRiskDomain;

mapping(address => PenaltyRecord[]) public penaltyHistory;
mapping(address => mapping(PenaltyType => PenaltyRecord)) public activePenaltiesByType;

mapping(address => bool) private _isFrozen;
mapping(address => uint256) public freezeExpiration;
mapping(address => uint256) public withdrawalDelayExtension; // Additional delay in seconds
mapping(address => uint256) public feeMultiplier; // Basis points (10000 = 1x)
mapping(address => uint256) public investmentLimitReduction; // Basis points (10000 = 100%)
mapping(address => uint256) public violationCount; // For gradual escalation
```

## Constructor

```solidity
constructor(address _investorRegistry, address _investorRiskDomain)
```

**Purpose**: Initialize InvestorPenaltyEngine

**Parameters**:

- `_investorRegistry`: InvestorRegistry contract address
- `_investorRiskDomain`: InvestorRiskDomain contract address

**Requirements**:

- Both addresses must be non-zero

**Errors**:

- `InvalidAddress()`: If any address is zero

## Functions

### `applyPenalty`

```solidity
function applyPenalty(
    address investor,
    PenaltyType pType,
    uint256 severity
) external onlyInvestorRiskDomain
```

**Purpose**: Apply penalty to investor with severity-based calculation and gradual escalation

**Parameters**:

- `investor`: Investor address
- `pType`: Type of penalty (WITHDRAWAL_DELAY, FEE_INCREASE, LIMIT_REDUCTION, TEMP_FREEZE)
- `severity`: Severity level (1-10)

**Access Control**: Only InvestorRiskDomain

**Behavior**:

1. Validates investor is registered
2. Validates severity is within range (1-10)
3. Checks and expires old penalties
4. Calculates escalated severity based on violation count
5. Calculates duration: `escalatedSeverity * 1 day` (capped at 365 days)
6. Creates penalty record and stores in history
7. Applies penalty effects based on type
8. Increments violation count for escalation
9. Emits penalty-specific event

**Penalty Type Calculations**:

- **WITHDRAWAL_DELAY**:

  - Delay = `severity * 1 day` (max 30 days)
  - Example: severity 5 = 5 days delay

- **FEE_INCREASE**:

  - Multiplier = `10000 + (severity * 1000)` basis points
  - Example: severity 3 = 13000 (1.3x), severity 10 = 20000 (2x, capped)

- **LIMIT_REDUCTION**:

  - Reduction = `severity * 1000` basis points (10% per severity level)
  - Example: severity 5 = 5000 (50%), severity 10 = 10000 (100%, capped at 9000 = 90%)

- **TEMP_FREEZE**:
  - Duration = `severity * 1 day`
  - Example: severity 7 = 7 days freeze

**Gradual Escalation**:

- Each violation increases severity by 20% (1.2x multiplier)
- Formula: `escalatedSeverity = baseSeverity * (1.2 ^ violationCount)`
- Capped at MAX_SEVERITY (10)
- Violation count is incremented for each penalty application (regardless of type)
- Example:
  - First violation: severity 3 → 3 (no escalation, violationCount = 0)
  - Second violation: severity 3 → 3.6 → 4 (rounded, violationCount = 1)
  - Third violation: severity 3 → 4.32 → 4 (rounded, violationCount = 2)

**Events Emitted**:

- `PenaltyApplied`: General penalty application event
- `WithdrawalDelayPenalty`: When WITHDRAWAL_DELAY is applied
- `FeeIncreasePenalty`: When FEE_INCREASE is applied
- `LimitReductionPenalty`: When LIMIT_REDUCTION is applied
- `TempFreezePenalty`: When TEMP_FREEZE is applied

**Errors**:

- `NotInvestorRiskDomain()`: Caller is not authorized
- `InvalidAddress()`: Investor address is zero
- `InvestorNotRegistered()`: Investor is not registered
- `InvalidSeverity()`: Severity is outside 1-10 range

### `getPenaltyStatus`

```solidity
function getPenaltyStatus(address investor)
    external view returns (
        PenaltyRecord memory activePenalty,
        bool isCurrentlyFrozen,
        uint256 currentFeeMultiplier,
        uint256 withdrawalDelay,
        uint256 limitReduction
    )
```

**Purpose**: Get current penalty status for investor

**Parameters**:

- `investor`: Investor address

**Returns**:

- `activePenalty`: Current active penalty record (most restrictive)
- `isCurrentlyFrozen`: Whether investor is currently frozen
- `currentFeeMultiplier`: Current fee multiplier (basis points, 10000 = 1x)
- `withdrawalDelay`: Current withdrawal delay extension in seconds
- `limitReduction`: Current investment limit reduction (basis points, 10000 = 100%)

**Behavior**:

- Returns most restrictive active penalty
- Checks expiration for all penalty types
- Returns default values if no active penalties

**Access Control**: Public view function

### `getPenaltyHistory`

```solidity
function getPenaltyHistory(address investor)
    external view returns (PenaltyRecord[] memory)
```

**Purpose**: Get all penalties applied to investor

**Parameters**:

- `investor`: Investor address

**Returns**: Array of penalty records with timestamps, types, severities, and expiration times

**Access Control**: Public view function

### `isFrozen`

```solidity
function isFrozen(address investor) external view returns (bool)
```

**Purpose**: Check if investor is currently frozen

**Parameters**:

- `investor`: Investor address

**Returns**: `true` if frozen and not expired, `false` otherwise

**Access Control**: Public view function

### `getWithdrawalDelay`

```solidity
function getWithdrawalDelay(address investor) external view returns (uint256)
```

**Purpose**: Get withdrawal delay extension for investor

**Parameters**:

- `investor`: Investor address

**Returns**: Withdrawal delay extension in seconds (0 if no active penalty or expired)

**Access Control**: Public view function

### `getInvestmentLimitReduction`

```solidity
function getInvestmentLimitReduction(address investor)
    external view returns (uint256)
```

**Purpose**: Get investment limit reduction for investor

**Parameters**:

- `investor`: Investor address

**Returns**: Limit reduction in basis points (0 = no reduction, 10000 = 100% reduction)

**Access Control**: Public view function

### `getFeeMultiplier`

```solidity
function getFeeMultiplier(address investor) external view returns (uint256)
```

**Purpose**: Get fee multiplier for investor

**Parameters**:

- `investor`: Investor address

**Returns**: Fee multiplier in basis points (10000 = 1x, 11000 = 1.1x, 20000 = 2x max)

**Access Control**: Public view function

## Events

```solidity
event PenaltyApplied(
    address indexed investor,
    PenaltyType penaltyType,
    uint256 severity,
    uint256 duration,
    uint256 expiration
);

event WithdrawalDelayPenalty(
    address indexed investor,
    uint256 delayExtension,
    uint256 expiration
);

event FeeIncreasePenalty(
    address indexed investor,
    uint256 multiplier,
    uint256 expiration
);

event LimitReductionPenalty(
    address indexed investor,
    uint256 reduction,
    uint256 expiration
);

event TempFreezePenalty(
    address indexed investor,
    uint256 duration,
    uint256 expiration
);

event PenaltyExpired(
    address indexed investor,
    PenaltyType penaltyType
);
```

## Custom Errors

```solidity
error NotInvestorRiskDomain();
error InvalidAddress();
error InvalidSeverity();
error InvestorNotRegistered();
error MaxDurationExceeded();
error MaxWithdrawalDelayExceeded();
error MaxFeeMultiplierExceeded();
error MaxLimitReductionExceeded();
```

## Penalty Expiration

Penalties automatically expire after their duration. Expiration is checked:

- When applying a new penalty (via `_checkAndExpirePenalties`)
- When querying penalty status (via internal getter functions)
- When checking if investor is frozen

**Expiration Behavior**:

- Expired penalties are automatically cleared from active penalties mapping
- Expired penalties emit `PenaltyExpired` event
- Expired penalties reset their corresponding state variables (delay, multiplier, reduction, freeze status)
- Penalty history is preserved (expired penalties remain in history)

## Gradual Escalation Mechanism

The contract implements gradual escalation to increase penalty severity with repeated violations:

- **First Violation**: Base severity (no escalation)
- **Subsequent Violations**: Severity multiplied by 1.2x per violation
- **Formula**: `escalatedSeverity = baseSeverity * (1.2 ^ violationCount)`
- **Cap**: Escalated severity is capped at MAX_SEVERITY (10)

**Example**:

- Violation 1: severity 3 → 3 (no escalation)
- Violation 2: severity 3 → 3.6 → 4 (rounded)
- Violation 3: severity 3 → 4.32 → 4 (rounded)
- Violation 4: severity 3 → 5.18 → 5 (rounded)

## Multiple Penalties

Multiple penalty types can be active simultaneously for the same investor:

- Each penalty type is tracked independently
- When applying a new penalty of the same type, if an existing penalty is more restrictive, the new penalty is not applied
- `getPenaltyStatus` returns the most restrictive active penalty
- All active penalties are enforced simultaneously
- Each penalty type maintains its own most restrictive value:
  - **WITHDRAWAL_DELAY**: Longer delay is more restrictive
  - **FEE_INCREASE**: Higher multiplier is more restrictive
  - **LIMIT_REDUCTION**: Higher reduction is more restrictive
  - **TEMP_FREEZE**: Freeze is always most restrictive (cannot be overridden)

## Test Scenarios

### Happy Path Tests

| Test Name                        | Scenario                                                      | Expected Result                                                                                   |
| -------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Apply withdrawal delay penalty   | InvestorRiskDomain applies withdrawal delay extension penalty | Withdrawal delay extended, penalty duration recorded, WithdrawalDelayPenalty event emitted        |
| Apply fee increase penalty       | InvestorRiskDomain applies fee multiplier increase            | Fee multiplier increased for investor, FeeIncreasePenalty event emitted                           |
| Apply investment limit reduction | InvestorRiskDomain reduces investor's investment limits       | Investment limits reduced, LimitReductionPenalty event emitted                                    |
| Apply temporary freeze           | InvestorRiskDomain applies temporary freeze penalty           | Investor frozen, cannot deposit or withdraw during freeze period, TempFreezePenalty event emitted |
| Query penalty status             | Query current penalty status for investor                     | Returns penalty type, severity, duration, expiration time if applicable                           |
| Penalty expiration               | Temporary penalty expires after duration                      | Investor restrictions lifted, investor can operate normally again                                 |
| Query penalty history            | Query all penalties applied to investor                       | Returns array of penalty records with timestamps, types, and severities                           |
| Gradual penalty escalation       | Investor receives multiple penalties, severity increases      | Penalties escalate gradually, severity increases with repeated violations                         |

### Edge Cases

| Test Name                                    | Scenario                                             | Expected Result                                                           |
| -------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| Apply penalty with zero duration             | Attempt to apply temporary freeze with 0 duration    | Transaction may succeed (no effect) or revert depending on implementation |
| Apply penalty with maximum duration          | Apply temporary freeze with maximum allowed duration | Penalty applied successfully, duration capped at maximum                  |
| Apply multiple penalties                     | Multiple penalties applied to same investor          | Penalties tracked independently, most restrictive penalty applies         |
| Penalty expiration at boundary               | Penalty expires exactly at expiration time           | Restrictions lifted correctly, investor can operate immediately           |
| Query penalty for investor with no penalties | Query penalty status for investor with no penalties  | Returns default status or empty, no penalties found                       |
| Penalty with minimum severity                | Apply penalty with severity = 1                      | Minimum penalty applied, restrictions minimal                             |
| Penalty with maximum severity                | Apply penalty with severity = 10                     | Maximum penalty applied, restrictions severe                              |

### Failure Cases

| Test Name                                 | Scenario                                                   | Expected Result                                          |
| ----------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| Apply penalty from non-authorized         | Non-authorized address attempts to apply penalty           | Transaction reverts with "Only InvestorRiskDomain" error |
| Apply invalid penalty type                | Attempt to apply invalid penalty type                      | Transaction reverts with validation error                |
| Apply penalty to non-registered investor  | Attempt to apply penalty to address that is not registered | Transaction reverts with "Investor not registered" error |
| Apply penalty with invalid severity       | Attempt to apply penalty with severity out of range        | Transaction reverts with "Invalid severity" error        |
| Query penalty for non-registered investor | Query penalty status for address that is not registered    | Returns default status or reverts                        |

### Security Tests

| Test Name                                | Scenario                                          | Expected Result                                                  |
| ---------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| Prevent unauthorized penalty application | Attacker attempts to apply penalty to investor    | Transaction reverts, only InvestorRiskDomain can apply penalties |
| Penalty duration enforcement             | Verify penalty duration cannot be bypassed        | Restrictions enforced until expiration, cannot bypass early      |
| Penalty stacking prevention              | Verify penalties don't stack inappropriately      | Most restrictive penalty applies, penalties don't compound       |
| Penalty history integrity                | Verify penalty history cannot be manipulated      | History append-only, past penalties cannot be modified           |
| Freeze enforcement                       | Verify frozen investor cannot deposit or withdraw | Operations check freeze status, frozen investors rejected        |
| Fee multiplier enforcement               | Verify fee multipliers applied correctly          | Fee calculations use increased multiplier, penalties effective   |
| Withdrawal delay enforcement             | Verify withdrawal delays extended correctly       | Withdrawal queue respects delay extension, cannot withdraw early |

### Access Control Tests

| Test Name                           | Scenario                                    | Expected Result                                    |
| ----------------------------------- | ------------------------------------------- | -------------------------------------------------- |
| Apply penalty by InvestorRiskDomain | InvestorRiskDomain applies penalty          | Transaction succeeds                               |
| Apply penalty by non-authorized     | Non-authorized attempts to apply penalty    | Transaction reverts with "Only InvestorRiskDomain" |
| Query functions by any address      | Any address queries penalty status, history | Queries succeed, read-only functions are public    |

### Integration Tests

| Test Name                        | Scenario                                                            | Expected Result                                                                 |
| -------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| InvestorRiskDomain penalty flow  | InvestorRiskDomain detects violation, PenaltyEngine applies penalty | Complete flow succeeds, investor penalized appropriately                        |
| Fund vault penalty enforcement   | Vault checks penalty status before allowing operations              | Penalties enforced correctly, restricted operations blocked                     |
| InvestorStateMachine integration | Penalty applied, state machine may change investor state            | State updated appropriately based on penalty severity                           |
| Penalty expiration automation    | Penalty expires automatically, restrictions lifted                  | Expiration checked correctly, investor can operate after expiration             |
| Multiple penalty types           | Different penalty types applied to investor                         | All penalties tracked correctly, most restrictive applies                       |
| Gradual escalation integration   | Multiple violations lead to gradually increasing penalties          | Penalty severity increases with repeated violations, escalation works correctly |

### Gas Optimization Tests

| Test Name                | Scenario                                       | Expected Result                              |
| ------------------------ | ---------------------------------------------- | -------------------------------------------- |
| Penalty application gas  | InvestorRiskDomain applies penalty             | Gas usage reasonable for penalty application |
| Penalty status check gas | Check investor penalty status before operation | Gas usage reasonable for status check        |
| Query operations gas     | Multiple queries for penalty status, history   | View functions consume no gas (read-only)    |

---

**Next**: [InvestorRewardEngine](/protocol/contracts/investor/InvestorRewardEngine)
