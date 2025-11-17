# Daily Settlement Process

## Overview

End-of-day operations: fee accrual, performance snapshots, limit resets, and reporting.

## Timing

Runs daily at 00:00 UTC

## Operations

### 1. Reset Daily Limits

```solidity
// Reset trade counters
dailyTrades[fundId] = 0;

// Reset withdrawal limits
dailyWithdrawn[fundId] = 0;
```

### 2. Accrue Management Fees

```typescript
for (const fund of activeFunds) {
  const dailyFee = (fund.NAV * fund.managementFee / 365) / 10000;
  await vault.accrueFee(fund.id, dailyFee);
}
```

### 3. Calculate Daily Performance

```typescript
const dailyReturn = (todayNAV - yesterdayNAV) / yesterdayNAV;
await analyticsHub.recordDailyReturn(fundId, dailyReturn);
```

### 4. Update Risk Metrics

- Recalculate 30-day volatility
- Update drawdown from HWM
- Refresh correlation matrices

### 5. Generate Reports

- Daily fund snapshots
- Performance summaries
- Risk metric updates

---

**Related**: [NAV Update](/docs/protocol/processes/system/nav-update)

