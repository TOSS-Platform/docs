# Stake Management Process

## Overview

FM increases stake when fund AUM grows to maintain required collateral ratio.

## When to Increase Stake

**Trigger**: Fund AUM grows beyond current stake coverage

**Formula Check**:
```
Current Requirement = baseMinimum + (AUM × 0.001)

If currentStake < currentRequirement:
    Must add: currentRequirement - currentStake
```

## Process

### Increase Stake

```solidity
// 1. Approve additional TOSS
await toss.approve(fundFactory.address, additionalAmount);

// 2. Increase stake
await fundFactory.increaseStake(fundId, additionalAmount);
```

**Result**: Total stake increased, fund can grow further

### Decrease Stake

**Not Allowed**: Cannot decrease stake while fund active

**Only After**: Fund closed and all investors withdrawn

---

**Related**: [Fund Closure](/protocol/processes/fund-manager/close-fund)

