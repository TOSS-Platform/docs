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

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Apply temporary freeze | PenaltyEngine applies temporary freeze penalty to FM | FM frozen for specified duration, freeze status recorded, FM cannot execute trades during freeze |
| Apply warning penalty | PenaltyEngine applies warning penalty to FM | Warning recorded, no operational restrictions, WarningPenalty event emitted |
| Apply fee increase penalty | PenaltyEngine applies fee increase penalty | FM's fee rates increased temporarily, FeeIncreasePenalty event emitted |
| Apply trade restriction penalty | PenaltyEngine restricts FM from trading | FM cannot execute trades for specified period, TradeRestrictionPenalty event emitted |
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
| Apply penalty to non-existent FM | Attempt to apply penalty to address that is not an FM | Transaction reverts with "Not Fund Manager" error |
| Query penalty for non-existent FM | Query penalty status for address that is not an FM | Returns default status or reverts |

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

