# Intent Detection Process

## Overview

Real-time detection of potentially malicious FM behavior through pattern analysis.

## Signals Analyzed

1. **Front-Running**: Trading right before investor withdrawal
2. **Wash Trading**: Self-dealing patterns
3. **Manipulation**: Targeting low-liquidity assets
4. **Timing**: Suspicious trade timing patterns

## Process

```
Trade Request → IntentDetection.analyze()
                ↓
    Check patterns, timing, asset liquidity
                ↓
    Calculate Intent Probability (0-100)
                ↓
    Return I component for FaultIndex
```

## Detection Examples

```typescript
// Front-running detection
if (largePendingWithdrawal && fmTradesAgainstInvestor) {
  intentProbability = 80;  // High suspicion
}

// Wash trading
if (buyAndSellSameAsset && lowVolume) {
  intentProbability = 70;
}
```

---

**Related**: [IntentDetection Contract](/protocol/contracts/risk/IntentDetection)

