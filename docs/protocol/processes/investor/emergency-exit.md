# Emergency Exit Process

## Overview

Fast withdrawal during fund emergency (bypasses queue, pays higher fee).

## Trigger Conditions

- Fund in EMERGENCY state
- Major loss event (>30% in 24h)
- FM violation detected
- Oracle failure

## Process

```solidity
uint256 amount = vault.emergencyWithdraw(shares);
```

**Differences from Normal Withdrawal**:
- ✓ Immediate (no queue)
- ✓ Bypasses daily limit
- ✗ Higher fee (5% emergency fee)
- ✗ May get unfavorable NAV

## When to Use

**Use If**:
- Fund experiencing critical issues
- Need immediate liquidity
- Willing to pay 5% fee

**Don't Use If**:
- Normal market volatility
- Can wait 24h for queue
- Want to avoid emergency fee

---

**Related**: [Emergency Procedures](/protocol/processes/system/emergency-procedures)

