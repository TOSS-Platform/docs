# InvestorStateMachine.sol

## Overview

Manages investor lifecycle states based on behavior, violations, and risk metrics. Enables automatic restrictions for problematic investors.

## Purpose

- Manage investor state transitions
- Apply restrictions based on state
- Protect protocol from bad actors
- Enable recovery for good behavior

## States

```
ACTIVE → Normal operations
LIMITED → Reduced limits, warnings issued
HIGH_RISK → Enhanced monitoring, restricted access
FROZEN → Investigation required, no operations
BANNED → Permanent exclusion
```

## Functions

### `transition`

```solidity
function transition(
    address investor,
    InvestorState newState,
    string calldata reason
) external onlyInvestorRiskDomain
```

**Purpose**: Transition investor to new state

**Parameters**:
- `investor`: Address to transition
- `newState`: Target state
- `reason`: Reason for transition

**Access Control**: Only InvestorRiskDomain

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Query investor state | Query current state for investor | Returns InvestorState enum (ACTIVE, LIMITED, SUSPENDED, BANNED) |
| Transition to LIMITED | InvestorRiskDomain detects violation, state transitions to LIMITED | State updated to LIMITED, InvestorStateChanged event emitted, investor restrictions apply |
| Transition to SUSPENDED | Multiple violations detected, state transitions to SUSPENDED | State updated to SUSPENDED, more severe restrictions apply |
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
| State recovery after suspension | Investor in SUSPENDED state, recovery period expires | State may recover to LIMITED or ACTIVE depending on implementation |
| Query state for non-registered investor | Query state for address not registered | Returns default state or reverts depending on implementation |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Transition from non-authorized | Non-authorized address attempts to change investor state | Transaction reverts with "Not authorized" error |
| Invalid state transition | Attempt invalid state transition (e.g., BANNED to ACTIVE) | Transaction reverts with "Invalid state transition" error |
| Transition to same state | Attempt to transition to current state | Transaction may succeed (no-op) or revert depending on implementation |
| Transition for non-registered investor | Attempt to change state for address not registered | Transaction reverts with "Investor not registered" error |

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
| Change state by authorized contract | Authorized contract (e.g., InvestorRiskDomain) changes state | Transaction succeeds |
| Change state by non-authorized | Non-authorized attempts to change state | Transaction reverts with "Not authorized" |
| Query state by any address | Any address queries investor state | Queries succeed, read-only functions are public |
| Query state history by any address | Any address queries state transition history | Queries succeed, history is publicly readable |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| InvestorRiskDomain state changes | InvestorRiskDomain detects violations, state machine updates state | State updated correctly, restrictions applied |
| InvestorRegistry state sync | State machine updates state, registry reflects change | Registry state updated correctly, state synchronized |
| Penalty engine integration | Penalty applied, state machine may change state | State changes appropriately based on penalty severity |
| State-based restrictions | Investor operations check state, restrictions enforced | Operations blocked appropriately based on state |
| Recovery automation | Violations expire, state automatically recovers | Recovery triggers correctly, state transitions back to ACTIVE |

### State Transition Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| ACTIVE → LIMITED | Investor receives first violation | State transitions correctly to LIMITED |
| LIMITED → ACTIVE | Violations expire, investor recovers | State transitions back to ACTIVE |
| LIMITED → SUSPENDED | Investor receives additional violations while LIMITED | State transitions to SUSPENDED |
| SUSPENDED → LIMITED | Investor recovers from suspension | State transitions back to LIMITED |
| SUSPENDED → BANNED | Critical violations while SUSPENDED | State transitions to BANNED |
| BANNED (permanent) | Investor banned, no recovery possible | State remains BANNED permanently, cannot transition back |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| State transition gas | Authorized contract changes investor state | Gas usage reasonable for state change |
| State query gas | Query current investor state | Gas usage reasonable for query |
| State history query gas | Query state transition history | Gas usage reasonable for history query |
| Query operations gas | Multiple queries for state, history | View functions consume no gas (read-only) |

---

**Next**: [InvestorPenaltyEngine](/protocol/contracts/investor/InvestorPenaltyEngine)

