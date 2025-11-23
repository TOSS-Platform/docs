# InvestorStateMachine.sol

## Overview

Manages investor lifecycle states based on behavior, violations, and risk metrics. Enables automatic restrictions for problematic investors and recovery mechanisms for good actors.

## Purpose

- Manage investor state transitions
- Apply restrictions based on state
- Protect protocol from bad actors
- Enable recovery for good behavior
- Track state history for auditability

## States

The contract manages five investor states:

```
ACTIVE → Normal operations, full access
LIMITED → Reduced limits, warnings issued
HIGH_RISK → Enhanced monitoring, restricted access
FROZEN → Investigation required, no operations
BANNED → Permanent exclusion
```

## State Transition Matrix

| Current State | Next State | Condition | Recovery Period |
|--------------|------------|-----------|-----------------|
| ACTIVE | LIMITED | First violation OR WBR > 0.5 OR DVR > 0.7 OR LRI > 60 | 30 days clean |
| ACTIVE | HIGH_RISK | VS ≥ 3 OR Multiple violations (7 days) | 60 days clean |
| ACTIVE | FROZEN | IP > 0.8 OR Systemic risk | Manual review |
| ACTIVE | BANNED | Confirmed fraud/attack | Permanent |
| LIMITED | ACTIVE | 30 days clean AND all metrics normalized | N/A |
| LIMITED | HIGH_RISK | Additional violation OR VS ≥ 3 | 60 days clean |
| LIMITED | FROZEN | IP > 0.8 OR Critical violation | Manual review |
| HIGH_RISK | LIMITED | 60 days clean AND all metrics normalized | N/A |
| HIGH_RISK | FROZEN | Additional violation OR IP > 0.8 | Manual review |
| HIGH_RISK | BANNED | Confirmed fraud/attack | Permanent |
| FROZEN | HIGH_RISK | Investigation: No violation, Guardian approved | 60 days clean |
| FROZEN | BANNED | Investigation: Violation confirmed | Permanent |
| BANNED | - | No recovery possible | Permanent |

## Dependencies

- **InvestorRegistry**: Provides investor registration status and state storage
- **InvestorRiskDomain**: Authorized to trigger state transitions based on risk analysis

## Functions

### `getState`

```solidity
function getState(address investor) external view returns (IInvestorRegistry.InvestorState state)
```

**Purpose**: Get current investor state

**Parameters**:
- `investor`: Investor address

**Returns**: Current `InvestorState` enum value

**Behavior**:
- Returns state from internal storage if available
- Falls back to InvestorRegistry state for newly registered investors
- Reverts if investor is not registered

**Access Control**: Public view function

### `transition`

```solidity
function transition(
    address investor,
    IInvestorRegistry.InvestorState newState,
    string calldata reason
) external onlyInvestorRiskDomain
```

**Purpose**: Transition investor to new state

**Parameters**:
- `investor`: Address to transition
- `newState`: Target state
- `reason`: Reason for transition (stored in state history)

**Access Control**: Only InvestorRiskDomain

**Behavior**:
- Validates investor is registered
- Validates transition is allowed via `isValidTransition()`
- Records transition in state history
- Updates state in InvestorRegistry
- Sets `cleanPeriodStart` for ACTIVE and LIMITED states
- Sets `manualReviewPending` for FROZEN state
- Emits `InvestorStateChanged` event

**Events**:
- `InvestorStateChanged(address indexed investor, InvestorState fromState, InvestorState toState, string reason)`

**Errors**:
- `InvestorNotRegistered()`: Investor is not registered
- `InvalidAddress()`: Investor address is zero
- `SameState()`: Attempting to transition to same state
- `InvalidTransition()`: Transition is not allowed by state machine rules
- `OnlyInvestorRiskDomain()`: Caller is not authorized

### `isValidTransition`

```solidity
function isValidTransition(
    IInvestorRegistry.InvestorState from,
    IInvestorRegistry.InvestorState to
) public pure returns (bool)
```

**Purpose**: Check if a state transition is valid

**Parameters**:
- `from`: Current state
- `to`: Target state

**Returns**: `true` if transition is valid, `false` otherwise

**Rules**:
- Same state transitions are not allowed
- BANNED state cannot transition to any other state
- Valid transitions follow the state machine diagram (see State Transition Matrix above)

**Access Control**: Public pure function

### `canDeposit`

```solidity
function canDeposit(address investor) external view returns (bool)
```

**Purpose**: Check if investor can deposit

**Parameters**:
- `investor`: Investor address

**Returns**: `true` if investor can deposit, `false` otherwise

**Behavior**:
- Returns `false` for non-registered investors
- Returns `false` for FROZEN and BANNED states
- Returns `true` for ACTIVE, LIMITED, and HIGH_RISK states
- Note: Actual deposit limits are enforced by other contracts

**Access Control**: Public view function

### `canWithdraw`

```solidity
function canWithdraw(address investor) external view returns (bool)
```

**Purpose**: Check if investor can withdraw

**Parameters**:
- `investor`: Investor address

**Returns**: `true` if investor can withdraw, `false` otherwise

**Behavior**:
- Returns `false` for non-registered investors
- Returns `false` for FROZEN and BANNED states
- Returns `true` for ACTIVE, LIMITED, and HIGH_RISK states
- Note: Actual withdrawal limits are enforced by other contracts

**Access Control**: Public view function

### `getStateHistory`

```solidity
function getStateHistory(address investor) external view returns (StateTransition[] memory transitions)
```

**Purpose**: Get complete state transition history for an investor

**Parameters**:
- `investor`: Investor address

**Returns**: Array of `StateTransition` structs

**StateTransition Struct**:
```solidity
struct StateTransition {
    IInvestorRegistry.InvestorState fromState;
    IInvestorRegistry.InvestorState toState;
    uint256 timestamp;
    string reason;
    address triggeredBy; // Contract that triggered transition
}
```

**Access Control**: Public view function

### `getInvestorStateData`

```solidity
function getInvestorStateData(address investor) external view returns (InvestorStateData memory data)
```

**Purpose**: Get detailed state data for an investor

**Parameters**:
- `investor`: Investor address

**Returns**: `InvestorStateData` struct

**InvestorStateData Struct**:
```solidity
struct InvestorStateData {
    IInvestorRegistry.InvestorState currentState;
    uint256 stateChangedAt;
    uint256 violationsLast30Days;
    uint256 violationsLast7Days;
    uint256 lastViolationAt;
    uint256 cleanPeriodStart; // For recovery tracking
    string lastTransitionReason;
    bool manualReviewPending;
}
```

**Access Control**: Public view function

## State Variables

### Public Mappings

- `investorStates`: Maps investor address to `InvestorStateData`
- `stateHistory`: Maps investor address to array of `StateTransition` structs

### Immutable Variables

- `investorRegistry`: Reference to InvestorRegistry contract
- `investorRiskDomain`: Reference to InvestorRiskDomain contract (authorized to trigger transitions)

## Events

### `InvestorStateChanged`

```solidity
event InvestorStateChanged(
    address indexed investor,
    IInvestorRegistry.InvestorState fromState,
    IInvestorRegistry.InvestorState toState,
    string reason
)
```

Emitted when investor state transitions to a new state.

### `RecoveryEligible`

```solidity
event RecoveryEligible(
    address indexed investor,
    IInvestorRegistry.InvestorState currentState,
    IInvestorRegistry.InvestorState targetState
)
```

Emitted when investor becomes eligible for recovery (reserved for future use).

### `RecoveryCompleted`

```solidity
event RecoveryCompleted(
    address indexed investor,
    IInvestorRegistry.InvestorState fromState,
    IInvestorRegistry.InvestorState toState
)
```

Emitted when investor completes recovery transition (reserved for future use).

## Custom Errors

- `InvestorNotRegistered()`: Investor address is not registered in InvestorRegistry
- `InvalidAddress()`: Provided address is zero address
- `InvalidTransition()`: State transition is not allowed by state machine rules
- `OnlyInvestorRiskDomain()`: Caller is not the authorized InvestorRiskDomain contract
- `SameState()`: Attempting to transition to the same state

## Access Control

- **State Transitions**: Only `InvestorRiskDomain` contract can call `transition()`
- **Query Functions**: All view functions are public and can be called by anyone
- **State History**: Publicly readable for transparency and auditability

## Integration Points

### InvestorRegistry

- Reads investor registration status
- Updates investor state via `updateState()` when transitions occur
- Syncs state for newly registered investors

### InvestorRiskDomain

- Monitors investor behavior and risk metrics
- Triggers state transitions based on violations and risk analysis
- Only authorized contract that can call `transition()`

## State Restrictions

### ACTIVE
- ✅ Full deposit/withdrawal access (within fund limits)
- ✅ Access to all allowed funds (based on class)
- ✅ Full governance participation (if eligible)
- ✅ Normal transaction limits

### LIMITED
- ⚠️ Reduced deposit limit: 50% of normal limit
- ⚠️ Reduced withdrawal limit: 25% of normal limit
- ⚠️ Only Tier 1-2 funds accessible
- ✅ Governance participation (normal)

### HIGH_RISK
- ⚠️ Severely reduced deposit limit: 10% of normal limit
- ⚠️ Withdrawal limit: 50% of current balance (one-time)
- ⚠️ Only Tier 1 funds accessible
- ❌ No governance participation

### FROZEN
- ❌ All deposits blocked
- ❌ All withdrawals blocked
- ❌ No fund access
- ❌ No governance participation
- ⏳ Investigation pending

### BANNED
- ❌ All deposits permanently blocked
- ❌ All withdrawals permanently blocked
- ❌ No fund access
- ❌ No governance participation
- ❌ Permanent exclusion

## Recovery Mechanism

The contract tracks `cleanPeriodStart` for investors in ACTIVE and LIMITED states to support automatic recovery:

- **LIMITED → ACTIVE**: Requires 30 days clean period with no violations
- **HIGH_RISK → LIMITED**: Requires 60 days clean period with no violations

Recovery conditions are checked by InvestorRiskDomain, which triggers transitions when conditions are met.

## Security Considerations

1. **Unauthorized Transitions**: Only InvestorRiskDomain can trigger transitions
2. **Permanent Bans**: BANNED state cannot be reversed
3. **State History**: All transitions are immutable and auditable
4. **State Validation**: All transitions are validated against state machine rules
5. **Registry Sync**: State is synchronized with InvestorRegistry for consistency

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Query investor state | Query current state for investor | Returns InvestorState enum (ACTIVE, LIMITED, HIGH_RISK, FROZEN, BANNED) |
| Transition to LIMITED | InvestorRiskDomain detects violation, state transitions to LIMITED | State updated to LIMITED, InvestorStateChanged event emitted, investor restrictions apply |
| Transition to HIGH_RISK | Multiple violations detected, state transitions to HIGH_RISK | State updated to HIGH_RISK, more severe restrictions apply |
| Transition to FROZEN | Critical violation detected, state transitions to FROZEN | State updated to FROZEN, all operations suspended |
| Transition to BANNED | Critical violations detected, state transitions to BANNED | State updated to BANNED, investor permanently restricted |
| Transition back to ACTIVE | Violations expire or investor improves behavior, state transitions to ACTIVE | State updated to ACTIVE, restrictions lifted, normal operation resumed |
| Query state history | Query all state transitions for investor | Returns array of state changes with timestamps |
| Auto-recovery from LIMITED | Investor in LIMITED state, violations expire, state recovers to ACTIVE | State automatically transitions to ACTIVE, recovery works correctly |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Investor in initial ACTIVE state | New investor registered, default state | State is ACTIVE, no restrictions |
| State transition at boundary | State transitions exactly when violation threshold met | State transition triggers correctly, boundaries respected |
| Multiple state transitions | Investor state changes multiple times | All transitions tracked correctly, state history accurate |
| State recovery after HIGH_RISK | Investor in HIGH_RISK state, recovery period expires | State may recover to LIMITED depending on conditions |
| Query state for non-registered investor | Query state for address not registered | Reverts with InvestorNotRegistered error |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Transition from non-authorized | Non-authorized address attempts to change investor state | Transaction reverts with OnlyInvestorRiskDomain error |
| Invalid state transition | Attempt invalid state transition (e.g., BANNED to ACTIVE) | Transaction reverts with InvalidTransition error |
| Transition to same state | Attempt to transition to current state | Transaction reverts with SameState error |
| Transition for non-registered investor | Attempt to change state for address not registered | Transaction reverts with InvestorNotRegistered error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized state changes | Attacker attempts to change investor state | Transaction reverts, only authorized contracts can change state |
| State transition integrity | Verify state transitions follow valid state machine | Only valid transitions allowed, invalid transitions rejected |
| State machine enforcement | Verify state machine rules enforced | State machine rules enforced, cannot bypass restrictions |
| State history immutability | Verify state history cannot be manipulated | History append-only, past transitions cannot be modified |
| Recovery mechanism integrity | Verify state recovery works correctly | Recovery conditions checked, state recovers when conditions met |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Change state by authorized contract | Authorized contract (InvestorRiskDomain) changes state | Transaction succeeds |
| Change state by non-authorized | Non-authorized attempts to change state | Transaction reverts with OnlyInvestorRiskDomain |
| Query state by any address | Any address queries investor state | Queries succeed, read-only functions are public |
| Query state history by any address | Any address queries state transition history | Queries succeed, history is publicly readable |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| InvestorRiskDomain state changes | InvestorRiskDomain detects violations, state machine updates state | State updated correctly, restrictions applied |
| InvestorRegistry state sync | State machine updates state, registry reflects change | Registry state updated correctly, state synchronized |
| State-based restrictions | Investor operations check state, restrictions enforced | Operations blocked appropriately based on state |
| Recovery automation | Violations expire, state automatically recovers | Recovery triggers correctly, state transitions back to ACTIVE |

### State Transition Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| ACTIVE → LIMITED | Investor receives first violation | State transitions correctly to LIMITED |
| LIMITED → ACTIVE | Violations expire, investor recovers | State transitions back to ACTIVE |
| LIMITED → HIGH_RISK | Investor receives additional violations while LIMITED | State transitions to HIGH_RISK |
| HIGH_RISK → LIMITED | Investor recovers from HIGH_RISK | State transitions back to LIMITED |
| HIGH_RISK → FROZEN | Critical violations while HIGH_RISK | State transitions to FROZEN |
| FROZEN → HIGH_RISK | Investigation complete, no violation | State transitions to HIGH_RISK |
| FROZEN → BANNED | Investigation confirms violation | State transitions to BANNED |
| BANNED (permanent) | Investor banned, no recovery possible | State remains BANNED permanently, cannot transition back |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| State transition gas | Authorized contract changes investor state | Gas usage reasonable for state change |
| State query gas | Query current investor state | Gas usage reasonable for query |
| State history query gas | Query state transition history | Gas usage reasonable for history query |
| Query operations gas | Multiple queries for state, history | View functions consume no gas (read-only) |

---

**Related**: [InvestorRiskDomain](/protocol/contracts/risk/InvestorRiskDomain), [InvestorRegistry](/protocol/contracts/investor/InvestorRegistry), [Investor State Machine Architecture](/protocol/architecture/investor-state-machine)

**Next**: [InvestorPenaltyEngine](/protocol/contracts/investor/InvestorPenaltyEngine)
