# InvestorPenaltyEngine.sol

## Overview

Applies penalties to investors for violations, including withdrawal delays, fee increases, and temporary restrictions.

## Purpose

- Apply investor penalties
- Track penalty history
- Enforce compliance
- Gradual escalation

## Functions

### `applyPenalty`

```solidity
function applyPenalty(
    address investor,
    PenaltyType pType,
    uint256 severity
) external onlyInvestorRiskDomain
```

**Penalty Types**:
- Withdrawal delay extension
- Fee multiplier increase  
- Reduced investment limits
- Temporary freeze

---

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Apply withdrawal delay penalty | InvestorRiskDomain applies withdrawal delay extension penalty | Withdrawal delay extended, penalty duration recorded, WithdrawalDelayPenalty event emitted |
| Apply fee increase penalty | InvestorRiskDomain applies fee multiplier increase | Fee multiplier increased for investor, FeeIncreasePenalty event emitted |
| Apply investment limit reduction | InvestorRiskDomain reduces investor's investment limits | Investment limits reduced, LimitReductionPenalty event emitted |
| Apply temporary freeze | InvestorRiskDomain applies temporary freeze penalty | Investor frozen, cannot deposit or withdraw during freeze period, TempFreezePenalty event emitted |
| Query penalty status | Query current penalty status for investor | Returns penalty type, severity, duration, expiration time if applicable |
| Penalty expiration | Temporary penalty expires after duration | Investor restrictions lifted, investor can operate normally again |
| Query penalty history | Query all penalties applied to investor | Returns array of penalty records with timestamps, types, and severities |
| Gradual penalty escalation | Investor receives multiple penalties, severity increases | Penalties escalate gradually, severity increases with repeated violations |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Apply penalty with zero duration | Attempt to apply temporary freeze with 0 duration | Transaction may succeed (no effect) or revert depending on implementation |
| Apply penalty with maximum duration | Apply temporary freeze with maximum allowed duration | Penalty applied successfully, duration capped at maximum |
| Apply multiple penalties | Multiple penalties applied to same investor | Penalties tracked independently, most restrictive penalty applies |
| Penalty expiration at boundary | Penalty expires exactly at expiration time | Restrictions lifted correctly, investor can operate immediately |
| Query penalty for investor with no penalties | Query penalty status for investor with no penalties | Returns default status or empty, no penalties found |
| Penalty with minimum severity | Apply penalty with severity = 1 | Minimum penalty applied, restrictions minimal |
| Penalty with maximum severity | Apply penalty with severity = 10 | Maximum penalty applied, restrictions severe |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Apply penalty from non-authorized | Non-authorized address attempts to apply penalty | Transaction reverts with "Only InvestorRiskDomain" error |
| Apply invalid penalty type | Attempt to apply invalid penalty type | Transaction reverts with validation error |
| Apply penalty to non-registered investor | Attempt to apply penalty to address that is not registered | Transaction reverts with "Investor not registered" error |
| Apply penalty with invalid severity | Attempt to apply penalty with severity out of range | Transaction reverts with "Invalid severity" error |
| Query penalty for non-registered investor | Query penalty status for address that is not registered | Returns default status or reverts |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized penalty application | Attacker attempts to apply penalty to investor | Transaction reverts, only InvestorRiskDomain can apply penalties |
| Penalty duration enforcement | Verify penalty duration cannot be bypassed | Restrictions enforced until expiration, cannot bypass early |
| Penalty stacking prevention | Verify penalties don't stack inappropriately | Most restrictive penalty applies, penalties don't compound |
| Penalty history integrity | Verify penalty history cannot be manipulated | History append-only, past penalties cannot be modified |
| Freeze enforcement | Verify frozen investor cannot deposit or withdraw | Operations check freeze status, frozen investors rejected |
| Fee multiplier enforcement | Verify fee multipliers applied correctly | Fee calculations use increased multiplier, penalties effective |
| Withdrawal delay enforcement | Verify withdrawal delays extended correctly | Withdrawal queue respects delay extension, cannot withdraw early |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Apply penalty by InvestorRiskDomain | InvestorRiskDomain applies penalty | Transaction succeeds |
| Apply penalty by non-authorized | Non-authorized attempts to apply penalty | Transaction reverts with "Only InvestorRiskDomain" |
| Query functions by any address | Any address queries penalty status, history | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| InvestorRiskDomain penalty flow | InvestorRiskDomain detects violation, PenaltyEngine applies penalty | Complete flow succeeds, investor penalized appropriately |
| Fund vault penalty enforcement | Vault checks penalty status before allowing operations | Penalties enforced correctly, restricted operations blocked |
| InvestorStateMachine integration | Penalty applied, state machine may change investor state | State updated appropriately based on penalty severity |
| Penalty expiration automation | Penalty expires automatically, restrictions lifted | Expiration checked correctly, investor can operate after expiration |
| Multiple penalty types | Different penalty types applied to investor | All penalties tracked correctly, most restrictive applies |
| Gradual escalation integration | Multiple violations lead to gradually increasing penalties | Penalty severity increases with repeated violations, escalation works correctly |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Penalty application gas | InvestorRiskDomain applies penalty | Gas usage reasonable for penalty application |
| Penalty status check gas | Check investor penalty status before operation | Gas usage reasonable for status check |
| Query operations gas | Multiple queries for penalty status, history | View functions consume no gas (read-only) |

---

**Next**: [InvestorRewardEngine](/docs/protocol/contracts/investor/InvestorRewardEngine)

