# Penalty Application Process

## Overview

Non-slashing penalties for minor violations (warnings before slashing).

## Penalty Types

1. **Temporary Freeze**: Cannot trade for duration
2. **Rate Limit**: Reduced max daily trades
3. **Fee Increase**: Higher fees temporarily
4. **Reputation Penalty**: Lower FM score

## When Applied

- First-time minor violations
- Operational failures (late reports)
- Warnings before escalation

## Process

```solidity
penaltyEngine.applyPenalty(
    target: fm.address,
    type: PenaltyType.TEMP_FREEZE,
    duration: 86400  // 24 hours
);
```

**Effect**: FM cannot execute trades for 24h

---

**Related**: [PenaltyEngine](/protocol/contracts/risk/PenaltyEngine)

